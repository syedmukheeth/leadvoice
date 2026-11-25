// Reads a setting from the app's environment, falling back to the voice agent's .env
// (../telugu-agent/.env) so keys only need to be entered once. The file is re-read when it
// changes, so a new key works without restarting the app.
import { readFileSync, statSync } from "fs";
import path from "path";

const AGENT_ENV = path.join(process.cwd(), "..", "telugu-agent", ".env");
let cached: { mtime: number; values: Record<string, string> } | null = null;

function loadAgentEnv(): Record<string, string> {
  let mtime = 0;
  try {
    mtime = statSync(AGENT_ENV).mtimeMs;
  } catch {
    return {};
  }
  if (cached && cached.mtime === mtime) return cached.values;
  const values: Record<string, string> = {};
  try {
    for (const line of readFileSync(AGENT_ENV, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*([^#]*)/);
      if (m) values[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* unreadable: treat as empty */
  }
  cached = { mtime, values };
  return values;
}

export function setting(name: string): string | undefined {
  return process.env[name] || loadAgentEnv()[name] || undefined;
}
