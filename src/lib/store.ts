// Data access. Until Supabase is connected (NEXT_PUBLIC_SUPABASE_URL), the app runs on a
// local workspace saved in store.json (see paths.ts), seeded with sample data. Swap the body of
// these functions for Supabase queries in Phase 1b; pages and actions only call these.
import { promises as fs } from "fs";
import path from "path";
import { buildDemoStore } from "./demo";
import { dataDir } from "./paths";
import type { Agent, Call, Lead, Store } from "./types";

const FILE = path.join(dataDir(), "store.json");
let cache: Store | null = null;
let cachedMtime = 0;
let memoryOnly = false; // set when the disk can't be written: keep the workspace in memory

// Re-reads the file when it changed on disk (edited by hand or by another process), so an
// outside edit is picked up instead of being overwritten by the next save.
export async function getStore(): Promise<Store> {
  const mtime = await fs.stat(FILE).then((s) => s.mtimeMs, () => 0);
  if (cache && (memoryOnly || mtime === cachedMtime)) return cache;
  if (!mtime) {
    // No workspace yet: start with sample data.
    cache = buildDemoStore();
    await persist();
    return cache;
  }
  try {
    cache = JSON.parse(await fs.readFile(FILE, "utf8")) as Store;
    cachedMtime = mtime;
  } catch (e) {
    // Half-written or broken file: keep what's in memory rather than wiping it with sample data.
    if (!cache) throw new Error(`Can't read ${FILE}: ${(e as Error).message}`);
  }
  return cache;
}

async function persist() {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(cache, null, 1), "utf8");
    cachedMtime = (await fs.stat(FILE)).mtimeMs;
  } catch (e) {
    // Read-only disk: carry on from memory instead of failing every page.
    if (!memoryOnly) console.warn(`[store] can't write ${FILE}, keeping the workspace in memory:`, (e as Error).message);
    memoryOnly = true;
  }
}

export async function mutate(fn: (s: Store) => void) {
  const s = await getStore();
  fn(s);
  await persist();
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  return (await getStore()).agents.find((a) => a.id === id);
}

export async function getCallsFor(agentId?: string): Promise<Call[]> {
  const calls = (await getStore()).calls;
  return agentId ? calls.filter((c) => c.agentId === agentId) : calls;
}

export async function getLeads(): Promise<Lead[]> {
  return (await getStore()).leads;
}

export async function resetToSample() {
  cache = buildDemoStore();
  await persist();
}
