import { connection } from "next/server";
import { BadgeCheck, Phone, ShieldCheck } from "lucide-react";
import { Card, CardHead, PageHeader } from "@/components/ui";
import { PRICE_PER_MIN } from "@/lib/catalog";
import { inr } from "@/lib/format";
import { getStore } from "@/lib/store";
import { ResetSample } from "./ResetSample";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "Settings" };

const PACKS = [500, 2000, 5000, 10000];

export default async function SettingsPage() {
  await connection();
  const { workspace } = await getStore();
  const minutes = Math.floor(workspace.creditsInr / PRICE_PER_MIN.standard);
  return (
    <>
      <PageHeader eyebrow={workspace.industry} title="Settings" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card id="billing" className="overflow-hidden xl:row-span-2">
          <div className="bg-ink px-6 pb-6 pt-5 text-white">
            <p className="text-[11px] uppercase tracking-[.14em] text-white/50">Credits · 1 credit = ₹1, never expire</p>
            <p className="mt-2 font-display text-[64px] leading-none">{inr(workspace.creditsInr)}</p>
            <p className="mt-2 text-[13px] text-white/60">≈ {minutes.toLocaleString("en-IN")} minutes of talk time with standard voices</p>
          </div>
          <div className="p-6">
            <p className="mb-3 text-[13px] font-semibold">Top up</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PACKS.map((p) => (
                <button key={p} disabled title="Payments go live in Phase 4 (Razorpay)"
                  className="rounded-xl border border-line px-3 py-3 text-left opacity-80">
                  <span className="block font-display text-[26px] leading-none">{inr(p)}</span>
                  <span className="mt-1 block text-[11.5px] text-faint">~{Math.floor(p / PRICE_PER_MIN.standard)} min</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-faint">UPI, cards and net banking via Razorpay — switching on with billing.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Standard voices", PRICE_PER_MIN.standard, "Kavya, Priya, Ritu, Rahul, Dev"],
                ["Premium voices", PRICE_PER_MIN.premium, "Shruti, Amit, Rohan"],
              ].map(([n, p, who]) => (
                <div key={n as string} className="rounded-xl bg-paper/70 p-4">
                  <p className="text-[13px] font-semibold">{n}</p>
                  <p className="mt-1 font-display text-[32px] leading-none">₹{p}<span className="font-sans text-[13px] text-faint"> / min</span></p>
                  <p className="mt-1 text-[12px] text-faint">{who}</p>
                </div>
              ))}
            </div>
            <ul className="mt-4 space-y-1.5 text-[12.5px] text-muted">
              <li>• Billed per second of connected talk time. Unanswered calls are free.</li>
              <li>• No setup fee, no monthly minimum. Business number ₹599 / month.</li>
              <li>• Calls pause automatically when credits fall below ₹50 — never a surprise bill.</li>
            </ul>
          </div>
        </Card>

        <Card>
          <CardHead title="Business number" />
          <div className="px-5 pb-5">
            <div className="flex items-center gap-4 rounded-xl bg-paper/70 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-live-soft text-live"><Phone size={19} /></span>
              <div>
                <p className="font-mono text-[18px]">{workspace.number?.e164 ?? "No number yet"}</p>
                <p className="text-[12.5px] text-muted">{workspace.number?.status === "active" ? "Active · inbound + outbound · IVRS-ready" : "Complete KYC to get a number"}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-[13px] sm:grid-cols-2">
              <p className="flex items-center gap-2"><BadgeCheck size={16} className="text-live" /> Digital KYC (GST / PAN + address)</p>
              <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-live" /> DLT-registered caller ID</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="Calling rules" hint="applied to every AI employee" />
          <ul className="space-y-2.5 px-5 pb-5 text-[13.5px]">
            <li className="flex justify-between"><span className="text-muted">Calling hours</span><b>9:00 AM – 9:00 PM IST</b></li>
            <li className="flex justify-between"><span className="text-muted">Retries when unanswered</span><b>after 2 h, then 4 h · max 3 tries</b></li>
            <li className="flex justify-between"><span className="text-muted">Same number again</span><b>never within 10 min</b></li>
            <li className="flex justify-between"><span className="text-muted">Do-not-call requests</span><b>blocked forever</b></li>
            <li className="flex justify-between"><span className="text-muted">Voicemail</span><b>hang up, retry later</b></li>
          </ul>
        </Card>

        <Card className="xl:col-span-2">
          <CardHead title="Sample data" hint="this workspace runs on sample data until your account is connected" />
          <div className="px-5 pb-5"><ResetSample /></div>
        </Card>
      </div>
    </>
  );
}
