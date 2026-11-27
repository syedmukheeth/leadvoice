import { lockedResponse, unlockedRequest } from "@/lib/gate-server";
import { getAgent, saveCall } from "@/lib/store";
import type { Call, TranscriptLine } from "@/lib/types";

// POST /api/calls { agentId, transcript: [{ who, text, at }], durationSec }
// Saves a call made from this portal (Talk to AI) so it shows under Calls with its transcript.
export async function POST(request: Request) {
  if (!(await unlockedRequest())) return lockedResponse();
  const body = await request.json().catch(() => null);
  const agent = body?.agentId ? await getAgent(String(body.agentId)) : undefined;
  if (!agent) return Response.json({ error: "Unknown AI agent" }, { status: 404 });
  const transcript: TranscriptLine[] = (Array.isArray(body.transcript) ? body.transcript : [])
    .filter((l: TranscriptLine) => ["agent", "customer", "action"].includes(l?.who) && typeof l.text === "string" && l.text.trim())
    .slice(0, 200)
    .map((l: TranscriptLine) => ({ who: l.who, text: l.text.trim().slice(0, 1000), at: Math.max(0, Math.round(Number(l.at) || 0)) }));
  if (!transcript.some((l) => l.who === "agent")) return Response.json({ saved: false });

  // "Site visit booked · Sun 11 AM" -> outcome "Site visit booked"
  const actions = transcript.filter((l) => l.who === "action").map((l) => l.text);
  const outcome = actions.map((a) => a.split(" · ")[0]).find((o) => o === agent.outcome) ?? (actions.some((a) => /^Callback/.test(a)) ? "Callback" : actions.length ? actions[0].split(" · ")[0] : "Info shared");
  const durationSec = Math.min(3600, Math.max(1, Math.round(Number(body.durationSec) || 0)));
  const call: Call = {
    id: `tc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    agentId: agent.id, name: "You (test call)", phone: "Talk to AI", direction: agent.direction === "inbound" ? "inbound" : "outbound",
    status: "connected", outcome, leadStatus: outcome === agent.outcome ? "hot" : "warm",
    summary: actions.length ? `Test call: ${actions.join(", ")}.` : "Test call from the portal.",
    durationSec, costInr: Math.round((durationSec / 60) * 4.5 * 100) / 100, attempt: 1,
    startedAt: new Date(Date.now() - durationSec * 1000).toISOString(),
    transcript, actions: actions.map((label) => ({ key: /^Callback/.test(label) ? "callback" : "book_visit", label })),
  };
  await saveCall(call);
  return Response.json({ saved: true, id: call.id });
}
