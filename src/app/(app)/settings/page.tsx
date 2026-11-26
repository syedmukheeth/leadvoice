import { connection } from "next/server";
import { BadgeCheck, Phone, ShieldCheck } from "lucide-react";
import { Card, CardHead, PageHeader } from "@/components/ui";
import { PRICE_PER_MIN, VOICES } from "@/lib/catalog";
import { inr } from "@/lib/format";
import { getStore } from "@/lib/store";
import { ResetSample } from "./ResetSample";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "Settings" };

const PACKS = [500, 2000, 5000, 10000];
const voiceNames = (premium: boolean) => [...new Set(VOICES.filter((v) => v.premium === premium).map((v) => v.name.split(" (")[0]))].join(", ");

const RULES: [string, string][] = [
  ["Calling hours", "9 AM to 9 PM, India time"],
  ["Retries when unanswered", "After 2 h, then 4 h, up to 3 tries"],
  ["Same number again", "Never within 10 minutes"],
  ["Do-not-call requests", "Blocked permanently"],
  ["Voicemail", "Hang up and retry later"],
];

export default async function SettingsPage() {
  await connection();
  const { workspace } = await getStore();
  const minutes = Math.floor(workspace.creditsInr / PRICE_PER_MIN.standard);
  return (
    <>
      <PageHeader eyebrow={workspace.name} title="Settings" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="billing" className="xl:row-span-2">
          <div className="border-b border-line p-6">
            <p className="text-[13px] text-muted">Credits</p>
            <p className="mt-1 text-[40px] font-semibold leading-none tracking-[-0.035em] text-ink">{inr(workspace.creditsInr)}</p>
            <p className="mt-2 text-[13px] text-muted">
              About {minutes.toLocaleString("en-IN")} minutes of talk with standard voices. 1 credit is ₹1 and credits never expire.
            </p>
          </div>
          <div className="p-6">
            <p className="mb-3 text-[14px] font-semibold text-ink">Top up</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PACKS.map((p) => (
                <button key={p} disabled title="Payments switch on with billing (Razorpay)"
                  className="rounded-lg border border-line px-3 py-3 text-left disabled:cursor-not-allowed">
                  <span className="block text-[18px] font-semibold tracking-[-0.02em] text-ink">{inr(p)}</span>
                  <span className="mt-0.5 block text-[12px] text-faint">{Math.floor(p / PRICE_PER_MIN.standard).toLocaleString("en-IN")} min</span>
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[12.5px] text-faint">UPI, cards and net banking through Razorpay. Top-ups open when billing is switched on.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {([
                ["Standard voices", PRICE_PER_MIN.standard, voiceNames(false)],
                ["Premium voices", PRICE_PER_MIN.premium, voiceNames(true)],
              ] as const).map(([n, p, who]) => (
                <div key={n} className="rounded-lg border border-line p-4">
                  <p className="text-[13px] text-muted">{n}</p>
                  <p className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-ink">₹{p}<span className="text-[13px] font-normal tracking-normal text-faint"> per min</span></p>
                  <p className="mt-1 text-[12px] leading-relaxed text-faint">{who}</p>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-2 text-[13px] text-muted">
              <li>Billed per second of connected talk. Unanswered calls are free.</li>
              <li>No setup fee and no monthly minimum. A business number is ₹599 a month.</li>
              <li>Calls pause automatically when credits fall below ₹50, so there is never a surprise bill.</li>
            </ul>
          </div>
        </Card>

        <Card>
          <CardHead title="Business number" />
          <div className="px-5 pb-5">
            <div className="flex items-center gap-4 rounded-lg border border-line p-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-live-soft text-live"><Phone size={18} strokeWidth={1.75} /></span>
              <div>
                <p className="font-mono text-[16px] text-ink">{workspace.number?.e164 ?? "No number yet"}</p>
                <p className="text-[12.5px] text-muted">{workspace.number?.status === "active" ? "Active for inbound and outbound calls, IVRS ready" : "Complete KYC to get a number"}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-[13px] text-ink-3 sm:grid-cols-2">
              <p className="flex items-center gap-2"><BadgeCheck size={16} strokeWidth={1.75} className="text-live" /> Digital KYC (GST or PAN, plus address)</p>
              <p className="flex items-center gap-2"><ShieldCheck size={16} strokeWidth={1.75} className="text-live" /> DLT-registered caller ID</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="Calling rules" hint="Applied to every AI employee" />
          <dl className="divide-y divide-line border-t border-line text-[13.5px]">
            {RULES.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="xl:col-span-2">
          <CardHead title="Sample data" hint="This workspace runs on sample data until your account is connected" />
          <div className="px-5 pb-5"><ResetSample /></div>
        </Card>
      </div>
    </>
  );
}
