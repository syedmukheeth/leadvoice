import { setting } from "@/lib/env";
import { lockedResponse, unlockedRequest } from "@/lib/gate-server";
import { LIVE_MODEL, liveSetup, tokenRequest } from "@/lib/live";
import { getStore } from "@/lib/store";

// POST /api/live-call { agentId } -> { token, model }
// Starts a live voice call: builds the agent's session and locks it into a one-time Gemini Live
// token. The browser connects straight to Gemini with that token; the API key stays here.
// { fallback: true } tells the call screen to use step-by-step calls instead (quota or outage).
export async function POST(request: Request) {
  if (!(await unlockedRequest())) return lockedResponse();
  const body = await request.json().catch(() => null);
  if (!body?.agentId) return Response.json({ error: "Missing agentId" }, { status: 400 });
  const { agents, workspace } = await getStore();
  const agent = agents.find((a) => a.id === body.agentId);
  if (!agent) return Response.json({ error: "Unknown AI agent" }, { status: 404 });

  const key = setting("GOOGLE_API_KEY");
  if (!key) return Response.json({ error: "Add GOOGLE_API_KEY so your AI agent can talk.", setup: true }, { status: 503 });
  const model = setting("LIVE_MODEL") || LIVE_MODEL;

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(tokenRequest(liveSetup(agent, workspace.name, model))),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  const data = await res?.json().catch(() => null);
  if (res?.ok && typeof data?.name === "string") {
    return Response.json({ token: data.name, model }, { headers: { "Cache-Control": "no-store" } });
  }
  const reason = JSON.stringify(data?.error ?? "");
  console.info(`[live] token failed: ${res ? res.status : "timeout"} ${reason.slice(0, 200)}`);
  if (res && (res.status === 401 || res.status === 403 || /API_KEY|API key/i.test(reason))) {
    return Response.json({ error: "Gemini rejected the API key. Check GOOGLE_API_KEY.", setup: true }, { status: 503 });
  }
  return Response.json({ error: "Live calls are busy right now.", fallback: true }, { status: 502 });
}
