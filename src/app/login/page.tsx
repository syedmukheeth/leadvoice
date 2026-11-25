import Link from "next/link";
import { AudioLines } from "lucide-react";
import { Waveform } from "@/components/Waveform";
import { LANGUAGES } from "@/lib/catalog";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  const accountsReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-signal text-ink"><AudioLines size={19} strokeWidth={2.4} /></span>
          <span className="text-xl font-semibold">Lead<span className="font-display italic text-signal text-2xl">Voice</span></span>
        </div>
        <div className="mt-auto">
          <p className="font-display text-[64px] leading-[1.02]">Your next telecaller<br /><span className="italic text-signal">never sleeps.</span></p>
          <p className="mt-5 max-w-md text-[15px] text-white/65">AI employees that call every lead in Telugu, Hindi and English — book visits, send WhatsApps and update your CRM while they talk.</p>
          <div className="mt-8 flex gap-2">
            {LANGUAGES.map((l) => <span key={l.id} className="rounded-full border border-white/15 px-3.5 py-1.5 text-[14px]">{l.hello}</span>)}
          </div>
          <Waveform live bars={64} className="mt-10 h-14" color="bg-signal" />
        </div>
      </section>

      <section className="grid place-items-center p-6">
        <div className="w-full max-w-[380px]">
          <h1 className="font-display text-[44px] leading-none">Welcome back</h1>
          <p className="mt-2 text-[14px] text-muted">Sign in with your work email. We&apos;ll send a one-time link — no password to remember.</p>
          <form className="mt-8 space-y-3">
            <input type="email" required placeholder="you@business.com" disabled={!accountsReady}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] outline-none focus:border-ink disabled:opacity-60" />
            <button type="submit" disabled={!accountsReady}
              className="w-full rounded-xl bg-ink py-3 text-[15px] font-semibold text-white disabled:opacity-50">Email me a sign-in link</button>
          </form>
          {!accountsReady && (
            <div className="mt-6 rounded-xl bg-signal-soft p-4 text-[13px] leading-relaxed">
              Accounts switch on once Supabase is connected. Until then, explore the full product on the sample workspace.
              <Link href="/dashboard" className="mt-3 block w-full rounded-xl bg-signal py-2.5 text-center font-semibold text-ink">Open the sample workspace →</Link>
            </div>
          )}
          <p className="mt-6 text-center text-[13px] text-faint">New here? You get ₹50 of free calling — no card needed.</p>
        </div>
      </section>
    </div>
  );
}
