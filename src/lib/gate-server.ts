// Server-side gate checks. The proxy already redirects locked visitors, but server actions can be
// invoked by a POST to any route (including ones the proxy skips), so every action and paid API
// route checks the cookie again.
import { cookies } from "next/headers";
import { GATE_COOKIE, isUnlocked } from "./gate";

export async function unlockedRequest(): Promise<boolean> {
  return isUnlocked((await cookies()).get(GATE_COOKIE)?.value);
}

export async function requireUnlocked(): Promise<void> {
  if (!(await unlockedRequest())) throw new Error("This workspace is locked. Enter the site password first.");
}

export const lockedResponse = () =>
  Response.json({ error: "This workspace is locked. Enter the site password first." }, { status: 401 });
