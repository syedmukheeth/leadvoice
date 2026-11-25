"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate, resetToSample } from "./store";
import type { Agent, Lead } from "./types";

const id = (p: string) => `${p}_${randomBytes(5).toString("hex")}`;

export async function createAgent(input: Omit<Agent, "id" | "createdAt" | "status">) {
  const agent: Agent = { ...input, id: id("ag"), status: "live", createdAt: new Date().toISOString() };
  await mutate((s) => { s.agents.unshift(agent); });
  revalidatePath("/", "layout");
  redirect(`/agents/${agent.id}?hired=1`);
}

export async function updateAgent(agentId: string, patch: Partial<Pick<Agent, "name" | "role" | "opening" | "script" | "knowledge" | "outcome" | "voiceId" | "language" | "actions">>) {
  await mutate((s) => {
    const a = s.agents.find((x) => x.id === agentId);
    if (a) Object.assign(a, patch);
  });
  revalidatePath(`/agents/${agentId}`);
}

export async function setAgentStatus(agentId: string, status: Agent["status"]) {
  await mutate((s) => {
    const a = s.agents.find((x) => x.id === agentId);
    if (a) a.status = status;
  });
  revalidatePath("/", "layout");
}

const PHONE = /^(?:\+?91)?[6-9]\d{9}$/;
function normalisePhone(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, "").replace(/^0/, "");
  if (!PHONE.test(d)) return null;
  const ten = d.slice(-10);
  return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
}

export async function addLeads(rows: { name: string; phone: string; source?: string }[], agentId: string) {
  let added = 0, skipped = 0;
  await mutate((s) => {
    const existing = new Set(s.leads.map((l) => l.phone.replace(/\s/g, "")));
    for (const r of rows.slice(0, 5000)) {
      const phone = normalisePhone(r.phone ?? "");
      if (!phone || existing.has(phone.replace(/\s/g, ""))) { skipped++; continue; }
      existing.add(phone.replace(/\s/g, ""));
      const lead: Lead = {
        id: id("ld"), name: (r.name ?? "").trim().slice(0, 80) || "Unknown", phone,
        source: (r.source ?? "Upload").trim().slice(0, 40) || "Upload", agentId, status: "new",
        nextAction: "Call within a minute", createdAt: new Date().toISOString(),
      };
      s.leads.unshift(lead);
      added++;
    }
  });
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { added, skipped };
}

export async function createApiKey(label: string) {
  const secret = `lv_live_${randomBytes(18).toString("hex")}`;
  await mutate((s) => {
    s.workspace.apiKeys.unshift({ id: id("key"), label: label.trim().slice(0, 40) || "API key", prefix: secret.slice(0, 12), hash: createHash("sha256").update(secret).digest("hex"), createdAt: new Date().toISOString() });
  });
  revalidatePath("/developers");
  return secret; // shown once
}

export async function saveWebhook(url: string) {
  await mutate((s) => { s.workspace.webhookUrl = url.trim().slice(0, 300) || undefined; });
  revalidatePath("/developers");
}

export async function resetSampleData() {
  await resetToSample();
  revalidatePath("/", "layout");
}
