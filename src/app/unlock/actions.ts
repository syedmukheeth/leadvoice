"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_COOKIE, GATE_MAX_AGE, gatePassword, gateToken, safeEqual, safeNext } from "@/lib/gate";

export interface UnlockState { error?: string }

export async function unlock(_prev: UnlockState, form: FormData): Promise<UnlockState> {
  const password = gatePassword();
  if (!password) return { error: "No site password is set yet. Add SITE_PASSWORD in Vercel, then redeploy." };

  const [given, real] = await Promise.all([gateToken(String(form.get("password") ?? "")), gateToken(password)]);
  if (!safeEqual(given, real)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "That password is not right. Try again." };
  }

  (await cookies()).set(GATE_COOKIE, real, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_MAX_AGE,
  });
  redirect(safeNext(String(form.get("next") ?? "")));
}
