import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { GoogleGenAI } from "@google/genai";
import { corsPreflight, json, methodNotAllowed } from "./_shared/http";

function envGet(name: string): string | undefined {
  try {
    const netlify = (globalThis as { Netlify?: { env?: { get: (k: string) => string | undefined } } }).Netlify;
    if (netlify?.env?.get) return netlify.env.get(name) || undefined;
  } catch {
    /* ignore */
  }
  return process.env[name];
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

  const contentType = req.headers.get("content-type") || "";
  let audioBuffer: ArrayBuffer | null = null;
  let mimeType = "audio/webm";
  let liveTranscript = "";
  let questionType = "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("audio");
      liveTranscript = String(form.get("liveTranscript") || "");
      questionType = String(form.get("type") || "");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const blob = file as File;
        mimeType = blob.type || "audio/webm";
        audioBuffer = await blob.arrayBuffer();
      }
    } else {
      const body = (await req.json()) as {
        audioBase64?: string;
        mimeType?: string;
        liveTranscript?: string;
        type?: string;
      };
      liveTranscript = body.liveTranscript || "";
      questionType = body.type || "";
      mimeType = body.mimeType || "audio/webm";
      if (body.audioBase64) {
        const binary = atob(body.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        audioBuffer = bytes.buffer;
      }
    }
  } catch {
    return json({ error: "Invalid audio payload" }, 400);
  }

  if (!audioBuffer || audioBuffer.byteLength === 0) {
    return json({ transcript: liveTranscript, source: "live", blobKey: null }, 200);
  }

  const key = `recordings/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webm`;
  try {
    const store = getStore({ name: "pte-recordings", consistency: "strong" });
    await store.set(key, audioBuffer, { metadata: { contentType: mimeType, type: questionType } });
  } catch (error) {
    console.warn("[transcribe] blob store failed", error);
  }

  try {
    const ai = new GoogleGenAI({});
    const bytes = Buffer.from(audioBuffer);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: `Transcribe this PTE Academic speaking attempt verbatim. Return JSON {"transcript":"..."}. Question type: ${questionType || "unknown"}.`,
        },
        { inlineData: { mimeType, data: bytes.toString("base64") } },
      ],
    });
    const text = response.text || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    let transcript = liveTranscript;
    if (start >= 0 && end > start) {
      const parsed = JSON.parse(text.slice(start, end + 1)) as { transcript?: string };
      if (parsed.transcript) transcript = parsed.transcript;
    } else if (text.trim()) {
      transcript = text.trim();
    }
    return json({ transcript, source: "server", blobKey: key, liveTranscript });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription unavailable";
    return json({
      transcript: liveTranscript,
      source: "live",
      blobKey: key,
      warning: message,
      gatewayHint: envGet("GEMINI_API_KEY") ? undefined : "Deploy once and enable Netlify AI Gateway.",
    });
  }
};

export const config: Config = {
  path: "/api/transcribe",
  method: ["POST", "OPTIONS"],
};
