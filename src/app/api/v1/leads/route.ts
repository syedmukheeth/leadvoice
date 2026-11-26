import { createHash, timingSafeEqual } from "crypto";
import { addLeads } from "@/lib/actions";
import { getStore, mutate } from "@/lib/store";

// POST /api/v1/leads   Authorization: Bearer lv_live_…
// Body: { name, phone, source?, agent_id? } or { leads: [ ... ] }
export async function POST(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return Response.json({ error: "Missing API key (Authorization: Bearer lv_live_…)" }, { status: 401 });

  const store = await getStore();
  const digest = createHash("sha256").update(token).digest();
  const key = store.workspace.apiKeys.find((k) => k.hash && timingSafeEqual(Buffer.from(k.hash, "hex"), digest));
  if (!key) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Send JSON: { name, phone, source }" }, { status: 400 });
  const items: Record<string, unknown>[] = Array.isArray(body.leads) ? body.leads.slice(0, 500) : [body];
  const agentId = typeof body.agent_id === "string" && store.agents.some((a) => a.id === body.agent_id)
    ? body.agent_id : store.agents.find((a) => a.status === "live")?.id ?? store.agents[0]?.id;
  if (!agentId) return Response.json({ error: "Create an AI employee first" }, { status: 409 });

  const result = await addLeads(items.map((i) => ({ name: String(i.name ?? ""), phone: String(i.phone ?? ""), source: String(i.source ?? "API") })), agentId);
  await mutate((s) => {
    const k = s.workspace.apiKeys.find((x) => x.id === key.id);
    if (k) k.lastUsedAt = new Date().toISOString();
  });
  if (!result.added) return Response.json({ error: "No valid new numbers (invalid Indian mobile or already a lead)", ...result }, { status: 422 });
  return Response.json({ accepted: result.added, skipped: result.skipped, agent_id: agentId, calling: "within a minute, 9 AM to 9 PM IST" }, { status: 202 });
}
