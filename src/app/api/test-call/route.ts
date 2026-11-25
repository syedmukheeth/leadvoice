import { agentReply, speak, transcribe, VoiceError, type Turn } from "@/lib/voice";
import { getStore } from "@/lib/store";

// POST /api/test-call
// { agentId, history: Turn[], start?: true, text?: string, audio?: base64 16 kHz WAV }
// -> { heard, reply, audio (base64 mp3), action, end }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.agentId) return Response.json({ error: "Missing agentId" }, { status: 400 });
  const { agents, workspace } = await getStore();
  const agent = agents.find((a) => a.id === body.agentId);
  if (!agent) return Response.json({ error: "Unknown AI employee" }, { status: 404 });

  const history: Turn[] = Array.isArray(body.history)
    ? body.history.filter((t: Turn) => (t?.who === "agent" || t?.who === "customer") && typeof t.text === "string").slice(-30)
    : [];

  try {
    let heard = "";
    if (!body.start) {
      if (typeof body.audio === "string" && body.audio) {
        const wav = Buffer.from(body.audio, "base64");
        if (wav.length > 6_000_000) return Response.json({ error: "That was too long — keep it under a minute." }, { status: 413 });
        heard = await transcribe(wav, agent.language);
      } else {
        heard = String(body.text ?? "").slice(0, 500).trim();
      }
      if (!heard) return Response.json({ heard: "", reply: "", audio: "", end: false });
      history.push({ who: "customer", text: heard });
    }
    const r = await agentReply(agent, workspace.name, history, Boolean(body.start));
    const audio = await speak(r.reply, agent.voiceId, agent.language);
    return Response.json({ heard, reply: r.reply, audio, action: r.action, end: r.end });
  } catch (e) {
    const msg = e instanceof VoiceError ? e.message : "Something went wrong on the call.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
