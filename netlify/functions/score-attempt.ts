import type { Config, Context } from "@netlify/functions";
import OpenAI from "openai";
import { corsPreflight, json, methodNotAllowed } from "./_shared/http";

type ScorePayload = {
  type?: string;
  transcript?: string;
  expected?: string;
  keywords?: string[];
  duration?: number;
  maxDuration?: number;
  scores?: Record<string, unknown>;
  confidence?: number;
};

function heuristicScore(body: ScorePayload) {
  const transcript = (body.transcript || "").toLowerCase();
  const expected = (body.expected || "").toLowerCase();
  const keywords = Array.isArray(body.keywords) ? body.keywords : [];
  const missed = keywords.filter((k) => !transcript.includes(String(k).toLowerCase()));
  const drills = [
    "Read the prompt aloud twice, then record without looking at the text.",
    "Shadow a native recording of this item, matching pauses and stress.",
    "Retry the same question tomorrow, aiming to hit every missed keyword.",
  ];
  return {
    source: "heuristic",
    overallSummary:
      "Local fallback score: this is an estimate from word overlap, not an official PTE score.",
    bands: {
      content: body.scores?.content ?? null,
      pronunciation: body.scores?.pronunciation ?? null,
      fluency: body.scores?.fluency ?? null,
    },
    missedContentPoints: missed.slice(0, 12),
    nextDrills: drills,
    expectedCoverage: expected
      ? Math.round(
          (expected.split(/\s+/).filter((w) => w && transcript.includes(w)).length /
            Math.max(1, expected.split(/\s+/).length)) *
            100,
        )
      : 0,
  };
}

function parseModelJson(text: string | null | undefined, fallback: ReturnType<typeof heuristicScore>) {
  if (!text) return fallback;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return fallback;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    return {
      source: "ai",
      overallSummary: String(parsed.overallSummary || fallback.overallSummary),
      bands: parsed.bands && typeof parsed.bands === "object" ? parsed.bands : fallback.bands,
      missedContentPoints: Array.isArray(parsed.missedContentPoints)
        ? parsed.missedContentPoints.map(String).slice(0, 15)
        : fallback.missedContentPoints,
      nextDrills: Array.isArray(parsed.nextDrills)
        ? parsed.nextDrills.map(String).slice(0, 3)
        : fallback.nextDrills,
      expectedCoverage:
        typeof parsed.expectedCoverage === "number"
          ? parsed.expectedCoverage
          : fallback.expectedCoverage,
    };
  } catch {
    return fallback;
  }
}

export default async (req: Request, _context: Context) => {
  switch (req.method) {
    case "OPTIONS":
      return corsPreflight();
    case "POST":
      break;
    default:
      return methodNotAllowed(["POST", "OPTIONS"]);
  }

  let body: ScorePayload = {};
  try {
    body = (await req.json()) as ScorePayload;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const fallback = heuristicScore(body);

  try {
    const netlifyEnv = (globalThis as { Netlify?: { env?: { get: (k: string) => string | undefined } } }).Netlify;
    const model = (netlifyEnv?.env?.get && netlifyEnv.env.get("SCORE_MODEL")) || "gpt-4o-mini";
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a PTE Academic coach. Return JSON only with keys: overallSummary (string), bands {content, pronunciation, fluency} 0-90 estimates, missedContentPoints (string[]), nextDrills (exactly 3 short strings), expectedCoverage (0-100). Never claim official Pearson scoring.",
        },
        {
          role: "user",
          content: JSON.stringify({
            type: body.type,
            transcript: body.transcript,
            expected: body.expected,
            keywords: body.keywords,
            duration: body.duration,
            maxDuration: body.maxDuration,
            localScores: body.scores,
            confidence: body.confidence,
          }),
        },
      ],
    });
    const text = completion.choices[0]?.message?.content || "";
    return json(parseModelJson(text, fallback));
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI unavailable";
    return json({ ...fallback, warning: message });
  }
};

export const config: Config = {
  path: "/api/score-attempt",
  method: ["POST", "OPTIONS"],
};
