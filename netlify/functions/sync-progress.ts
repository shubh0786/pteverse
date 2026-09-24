import type { Config, Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { examRuns, gamify, questionAttempts, sessions, users, vocabState } from "../../db/schema";
import { corsPreflight, json, methodNotAllowed } from "./_shared/http";

type SyncBody = {
  sessions?: unknown[];
  examRuns?: unknown[];
  vocab?: unknown;
  gamify?: unknown;
  username?: string;
};

function idFor(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function recordKey(value: unknown): string {
  const record = value as { id?: unknown; timestamp?: unknown; questionId?: unknown };
  if (record?.id) return String(record.id);
  if (record?.timestamp || record?.questionId) {
    return `${record.timestamp || ""}:${record.questionId || ""}`;
  }
  return JSON.stringify(value);
}

export default async (req: Request, _context: Context) => {
  switch (req.method) {
    case "OPTIONS":
      return corsPreflight();
    case "GET":
    case "POST":
      break;
    default:
      return methodNotAllowed(["GET", "POST", "OPTIONS"]);
  }

  const user = await getUser();
  if (!user) {
    return json(
      {
        error: "Unauthorized",
        hint: "Enable Netlify Identity and sign in. Local practice still saves in the browser.",
      },
      401,
    );
  }

  const userId = user.id;
  const email = user.email || "";

  try {
    await db
      .insert(users)
      .values({ id: userId, email, username: user.user_metadata?.full_name || user.email || "user" })
      .onConflictDoNothing();
  } catch (error) {
    console.warn("[sync] user upsert skipped", error);
  }

  if (req.method === "GET") {
    try {
      const [sessionRows, examRows, vocabRows, gamifyRows] = await Promise.all([
        db.select().from(sessions).where(eq(sessions.userId, userId)),
        db.select().from(examRuns).where(eq(examRuns.userId, userId)),
        db.select().from(vocabState).where(eq(vocabState.userId, userId)).limit(1),
        db.select().from(gamify).where(eq(gamify.userId, userId)).limit(1),
      ]);
      return json({
        userId,
        email,
        sessions: sessionRows.map((row) => row.payload),
        examRuns: examRows.map((row) => row.payload),
        vocab: vocabRows[0]?.payload ?? null,
        gamify: gamifyRows[0]?.payload ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Database unavailable";
      return json({ error: message, sessions: [], examRuns: [] }, 503);
    }
  }

  let body: SyncBody = {};
  try {
    body = (await req.json()) as SyncBody;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    const incomingSessions = Array.isArray(body.sessions) ? body.sessions : [];
    const existingSessions = await db.select().from(sessions).where(eq(sessions.userId, userId));
    const existingSessionKeys = new Set(existingSessions.map((row) => recordKey(row.payload)));
    for (const session of incomingSessions.slice(0, 200)) {
      const payload = session as { questionId?: string; type?: string; timestamp?: number };
      const key = recordKey(session);
      if (existingSessionKeys.has(key)) continue;
      const sid = idFor("s");
      await db.insert(sessions).values({ id: sid, userId, payload: session as object });
      existingSessionKeys.add(key);
      if (payload && payload.type && payload.type !== "mock-test") {
        await db.insert(questionAttempts).values({
          id: idFor("a"),
          userId,
          type: String(payload.type),
          questionId: payload.questionId ? String(payload.questionId) : null,
          payload: session as object,
        });
      }
    }

    if (Array.isArray(body.examRuns)) {
      const existingRuns = await db.select().from(examRuns).where(eq(examRuns.userId, userId));
      const existingRunKeys = new Set(existingRuns.map((row) => recordKey(row.payload)));
      for (const run of body.examRuns.slice(0, 50)) {
        const key = recordKey(run);
        if (existingRunKeys.has(key)) continue;
        await db.insert(examRuns).values({ id: idFor("e"), userId, payload: run as object });
        existingRunKeys.add(key);
      }
    }

    if (body.vocab) {
      await db
        .insert(vocabState)
        .values({ userId, payload: body.vocab as object })
        .onConflictDoUpdate({ target: vocabState.userId, set: { payload: body.vocab as object } });
    }

    if (body.gamify) {
      await db
        .insert(gamify)
        .values({ userId, payload: body.gamify as object })
        .onConflictDoUpdate({ target: gamify.userId, set: { payload: body.gamify as object } });
    }

    return json({ ok: true, stored: incomingSessions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return json({ error: message, localFallback: true }, 503);
  }
};

export const config: Config = {
  path: "/api/sync",
  method: ["GET", "POST", "OPTIONS"],
};
