import { connection } from "next/server";
import { BadgeCheck, Phone, ShieldCheck } from "lucide-react";
import { Card, CardHead, PageHeader } from "@/components/ui";
import { CLIENT } from "@/lib/client";
import { getStore } from "@/lib/store";
import { ResetSample } from "./ResetSample";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "Settings" };

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
  return (
    <>
      <PageHeader eyebrow={`${CLIENT.name}, ${CLIENT.city}`} title="Settings" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHead title="Business number" />
          <div className="px-5 pb-5">
            <div className="flex items-center gap-4 rounded-lg border border-line p-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-live-soft text-live"><Phone size={18} strokeWidth={1.75} /></span>
              <div>
                <p className="font-mono text-[16px] text-ink">{workspace.number?.e164 ?? "No number yet"}</p>
                <p className="text-[12.5px] text-muted">{workspace.number?.status === "active" ? "Active for inbound and outbound calls" : "Being set up by your LeadVoice team"}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-[13px] text-ink-3 sm:grid-cols-2">
              <p className="flex items-center gap-2"><BadgeCheck size={16} strokeWidth={1.75} className="text-live" /> KYC verified business number</p>
              <p className="flex items-center gap-2"><ShieldCheck size={16} strokeWidth={1.75} className="text-live" /> DLT-registered caller ID</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="Calling rules" hint="Applied to every AI agent" />
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
          <CardHead title="Demo data" hint="Sample leads and calls shown until live calling starts" />
          <div className="px-5 pb-5"><ResetSample /></div>
        </Card>
      </div>
    </>
  );
}
