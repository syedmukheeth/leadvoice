// Data access. The workspace saved in store.json (see paths.ts) holds what people set or add:
// the AI agents, settings, uploaded leads and the calls made from this portal. The desk's day-to-day
// call activity is worked out from the clock (activity.ts) and merged in when pages read the store.
import { promises as fs } from "fs";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import path from "path";
import { generateActivity } from "./activity";
import { DEMO_AGENTS, buildDemoStore } from "./demo";
import { dataDir } from "./paths";
import type { Agent, Call, Lead, Store } from "./types";

const FILE = path.join(dataDir(), "store.json");
// Pages and the store read are cached for a minute (so pages come straight from the cache, with no
// wait), and every change to the workspace refreshes them at once.
export const STORE_TAG = "store";
export const LIVE = { stale: 60, revalidate: 60, expire: 600 };
const MAX_SAVED_CALLS = 300;
let base: Store | null = null;
let baseMtime = 0;
let memoryOnly = false; // set when the disk can't be written: keep the workspace in memory

// Leads and calls from older versions' fixed sample data (ld_0, cl_12): now generated, not saved.
const OLD_SAMPLE = /^(ld|cl)_\d+$/;

// Re-reads the file when it changed on disk (edited by hand or by another process), so an
// outside edit is picked up instead of being overwritten by the next save.
async function loadBase(): Promise<Store> {
  const mtime = await fs.stat(FILE).then((s) => s.mtimeMs, () => 0);
  if (base && (memoryOnly || mtime === baseMtime)) return base;
  if (!mtime) {
    base = buildDemoStore();
    await persist();
    return base;
  }
  try {
    const s = JSON.parse(await fs.readFile(FILE, "utf8")) as Store;
    s.leads = s.leads.filter((l) => !OLD_SAMPLE.test(l.id));
    s.calls = s.calls.filter((c) => !OLD_SAMPLE.test(c.id));
    base = s;
    baseMtime = mtime;
  } catch (e) {
    // Half-written or broken file: keep what's in memory rather than wiping it.
    if (!base) throw new Error(`Can't read ${FILE}: ${(e as Error).message}`);
  }
  return base;
}

async function persist() {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(base, null, 1), "utf8");
    baseMtime = (await fs.stat(FILE)).mtimeMs;
  } catch (e) {
    // Read-only disk: carry on from memory instead of failing every page.
    if (!memoryOnly) console.warn(`[store] can't write ${FILE}, keeping the workspace in memory:`, (e as Error).message);
    memoryOnly = true;
  }
}

// Activity is recomputed at most once a minute, or when the agents change.
let activity: { key: string; leads: Lead[]; calls: Call[] } | null = null;
function activityFor(agents: Agent[], now = Date.now()) {
  const key = `${Math.floor(now / 60_000)}|${agents.map((a) => `${a.id}:${a.direction}:${a.outcome}:${a.opening}`).join("|")}`;
  if (activity?.key !== key) activity = { key, ...generateActivity(agents, now) };
  return activity;
}

export async function getStore(): Promise<Store> {
  "use cache";
  cacheLife(LIVE);
  cacheTag(STORE_TAG);
  const b = await loadBase();
  const gen = activityFor(b.agents);
  return {
    ...b,
    leads: [...b.leads, ...gen.leads].sort((x, y) => y.createdAt.localeCompare(x.createdAt)),
    calls: [...b.calls, ...gen.calls].sort((x, y) => y.startedAt.localeCompare(x.startedAt)),
  };
}

// Changes the saved workspace (agents, settings, added leads, saved calls).
export async function mutate(fn: (s: Store) => void) {
  const s = await loadBase();
  fn(s);
  await persist();
  revalidateTag(STORE_TAG, { expire: 0 });
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  return (await loadBase()).agents.find((a) => a.id === id);
}

export async function getCallsFor(agentId?: string): Promise<Call[]> {
  const calls = (await getStore()).calls;
  return agentId ? calls.filter((c) => c.agentId === agentId) : calls;
}

export async function getLeads(): Promise<Lead[]> {
  return (await getStore()).leads;
}

// A call made from this portal (Talk to AI), kept with its transcript.
export async function saveCall(call: Call) {
  await mutate((s) => {
    s.calls.unshift(call);
    s.calls = s.calls.slice(0, MAX_SAVED_CALLS);
  });
}

// Puts the AI agents back the way they were set up. Leads and calls stay.
export async function restoreAgents() {
  await mutate((s) => { s.agents = structuredClone(DEMO_AGENTS); });
}
