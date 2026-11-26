import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Sidebar";
import { Waveform } from "@/components/Waveform";
import { LANGUAGES } from "@/lib/catalog";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  const accountsReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      <section className="hidden flex-col border-r border-line bg-surface p-12 lg:flex">
        <Logo />
        <div className="mt-auto max-w-[520px]">
          <h2 className="text-[44px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">Your next telecaller never sleeps.</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            AI employees that call every lead in Telugu, Hindi and English, then book the visit, send the WhatsApp and update your CRM while they talk.
          </p>
          <div className="mt-7 flex gap-2">
            {LANGUAGES.map((l) => <span key={l.id} className="rounded-full border border-line px-3 py-1 text-[14px] text-ink-3">{l.hello}</span>)}
          </div>
          <Waveform bars={64} className="mt-10 h-12" color="bg-viz-2" />
        </div>
      </section>

      <section className="grid place-items-center p-6">
        <div className="w-full max-w-[360px]">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-ink">Welcome back</h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">Sign in with your work email. We send a one-time link, so there is no password to remember.</p>
          <form className="mt-7 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Work email</span>
              <input type="email" required placeholder="you@business.com" disabled={!accountsReady}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-line-2 disabled:bg-paper" />
            </label>
            <button type="submit" disabled={!accountsReady}
              className="w-full rounded-lg bg-ink py-2.5 text-[14.5px] font-medium text-white transition-colors hover:bg-ink-2 disabled:opacity-50">Email me a sign-in link</button>
          </form>
          {!accountsReady && (
            <div className="mt-6 rounded-lg border border-line bg-paper p-4 text-[13px] leading-relaxed text-muted">
              Accounts switch on once Supabase is connected. Until then, explore the full product on the sample workspace.
              <Link href="/dashboard" className="mt-3 flex w-fit items-center gap-1 font-medium text-accent hover:text-accent-ink">
                Open the sample workspace <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          )}
          <p className="mt-6 text-center text-[13px] text-faint">New here? You get ₹50 of free calling, no card needed.</p>
        </div>
      </section>
    </div>
  );
}
