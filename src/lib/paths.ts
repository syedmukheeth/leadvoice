// Where the local workspace file and cached voice samples live.
// On Vercel the project folder is read-only, so data goes to the OS temp folder instead. That
// copy is per server instance and resets on redeploy: fine for the sample workspace until the
// Supabase database (Phase 1b) takes over.
import os from "os";
import path from "path";

export function dataDir(env: Record<string, string | undefined> = process.env, cwd = process.cwd()): string {
  return env.VERCEL ? path.join(os.tmpdir(), "leadvoice") : path.join(cwd, ".data");
}
