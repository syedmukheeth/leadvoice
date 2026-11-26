// Site password gate. The password lives only in the SITE_PASSWORD environment variable (never in
// the repo). Unlocking stores an HMAC of it in an HttpOnly cookie, so changing the password signs
// everyone out. On Vercel the site stays locked until SITE_PASSWORD is set; locally there is no
// gate unless you set it yourself.
// Uses Web Crypto only, so it runs the same in the proxy, route handlers and server actions.

export const GATE_COOKIE = "lv_gate";
export const GATE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const gatePassword = () => process.env.SITE_PASSWORD || undefined;
export const gateRequired = () => Boolean(process.env.SITE_PASSWORD || process.env.VERCEL);

export async function gateToken(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("leadvoice-gate-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time comparison, so response timing doesn't leak how much of a value matched.
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isUnlocked(cookieValue: string | undefined): Promise<boolean> {
  if (!gateRequired()) return true;
  const password = gatePassword();
  if (!password || !cookieValue) return false;
  return safeEqual(cookieValue, await gateToken(password));
}

// Where to go after unlocking: only same-site paths, never an outside URL.
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard";
}
