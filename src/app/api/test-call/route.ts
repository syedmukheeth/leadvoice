import { agentReply, missingVoiceKeys, speak, transcribe, VoiceError, type Turn } from "@/lib/voice";
import { getStore } from "@/lib/store";
import { openingLine } from "@/lib/opening";
import type { Language } from "@/lib/types";
import { lockedResponse, unlockedRequest } from "@/lib/gate-server";

// POST /api/test-call
// { agentId, history: Turn[], start?: true, text?: string, audio?: base64 16 kHz WAV }
// -> { heard, reply, audio (base64 mp3), action, end }
// A turn is speech-to-text + AI + voice: give it room, but the AI loop caps itself at ~16 s.
export const maxDuration = 60;

// GET /api/test-call -> { ready, missing: [key names] } so the call screen can check before opening the mic.
export async function GET() {
  if (!(await unlockedRequest())) return lockedResponse();
  const missing = missingVoiceKeys();
  return Response.json({ ready: missing.length === 0, missing });
}

const FILLERS: Record<Language, string[]> = {
  te: ["ఒక్క నిమిషం అండి.", "హా, చూస్తున్నాను అండి.", "సరే అండి, ఒక్క క్షణం."],
  hi: ["जी, एक सेकंड।", "अच्छा, एक मिनट जी।", "जी, देख रहे हैं।"],
  en: ["One moment, please.", "Sure, just a second.", "Okay, let me check."],
};
const fillerCache = new Map<string, string[]>();
async function fillersFor(voiceId: string, language: Language): Promise<string[]> {
  const key = `${voiceId}:${language}`;
  if (!fillerCache.has(key)) {
    const clips = await Promise.all(FILLERS[language].map((t) => speak(t, voiceId, language)));
    fillerCache.set(key, clips.filter(Boolean));
  }
  return fillerCache.get(key)!;
}

export async function POST(request: Request) {
  if (!(await unlockedRequest())) return lockedResponse();
  const body = await request.json().catch(() => null);
  if (!body?.agentId) return Response.json({ error: "Missing agentId" }, { status: 400 });
  const { agents, workspace } = await getStore();
  const agent = agents.find((a) => a.id === body.agentId);
  if (!agent) return Response.json({ error: "Unknown AI agent" }, { status: 404 });

  // Short "one moment" clips the call screen plays when a reply is slow, so there's no dead air.
  if (body.filler) {
    try {
      return Response.json({ fillers: await fillersFor(agent.voiceId, agent.language) });
    } catch {
      return Response.json({ fillers: [] });
    }
  }

  const history: Turn[] = Array.isArray(body.history)
    ? body.history.filter((t: Turn) => (t?.who === "agent" || t?.who === "customer") && typeof t.text === "string").slice(-30)
    : [];

  // Server-Timing shows where a slow reply spent its time (browser devtools → Network → Timing).
  const timing: string[] = [];
  const timed = async <T,>(name: string, work: Promise<T>) => {
    const t0 = Date.now();
    try { return await work; } finally { timing.push(`${name};dur=${Date.now() - t0}`); }
  };

  try {
    let heard = "";
    if (!body.start) {
      if (typeof body.audio === "string" && body.audio) {
        const wav = Buffer.from(body.audio, "base64");
        if (wav.length > 6_000_000) return Response.json({ error: "That was too long. Keep it under a minute." }, { status: 413 });
        heard = await timed("stt", transcribe(wav, agent.language));
      } else {
        heard = String(body.text ?? "").slice(0, 500).trim();
      }
      if (!heard) return Response.json({ heard: "", reply: "", audio: "", end: false });
      history.push({ who: "customer", text: heard });
    }
    // The greeting is the employee's written opening, spoken at once; the AI takes over from the first reply.
    const r = body.start
      ? { reply: openingLine(agent.opening), action: undefined, end: false }
      : await timed("llm", agentReply(agent, workspace.name, history, false));
    const audio = await timed("tts", speak(r.reply, agent.voiceId, agent.language));
    return Response.json(
      { heard, reply: r.reply, audio, action: r.action, end: r.end },
      { headers: { "Server-Timing": timing.join(", ") } },
    );
  } catch (e) {
    const msg = e instanceof VoiceError ? e.message : "Something went wrong on the call.";
    const setup = e instanceof VoiceError && e.setup;
    return Response.json({ error: msg, setup }, { status: setup ? 503 : 502 });
  }
}
