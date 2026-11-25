import { connection } from "next/server";
import { Card, CardHead, PageHeader } from "@/components/ui";
import { ago } from "@/lib/format";
import { getStore } from "@/lib/store";
import { KeyMaker, WebhookForm } from "./DevTools";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "Developers" };

export default async function DevelopersPage() {
  await connection();
  const { workspace, agents } = await getStore();
  const agentId = agents[0]?.id ?? "ag_xxx";
  return (
    <>
      <PageHeader eyebrow="API & webhooks" title="Developers" />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHead title="Send a lead" hint="your AI employee calls within a minute" />
          <div className="px-5 pb-5">
            <pre className="overflow-x-auto rounded-xl bg-ink p-4 font-mono text-[12.5px] leading-relaxed text-white/90">
{`curl -X POST https://<your-domain>/api/v1/leads \\
  -H "Authorization: Bearer lv_live_••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Rahul",
    "phone": "+91 98480 12345",
    "source": "Website",
    "agent_id": "${agentId}"
  }'`}
            </pre>
            <p className="mt-3 text-[13px] text-muted">→ <b className="text-ink">202 Accepted</b>, with the lead id. Invalid or do-not-call numbers are rejected with a reason.</p>

            <p className="mt-6 mb-2 text-[13px] font-semibold">Outcome webhook (we POST this after every call)</p>
            <pre className="overflow-x-auto rounded-xl bg-paper p-4 font-mono text-[12px] leading-relaxed text-ink-3">
{`{
  "event": "call.completed",
  "call_id": "cl_8f3a…",
  "lead": { "name": "Rahul", "phone": "+919848012345" },
  "status": "connected",
  "outcome": "Site visit booked",
  "lead_status": "hot",
  "summary": "Wants a 200 sq yd plot…",
  "duration_sec": 184,
  "cost_inr": 13.8
}`}
            </pre>
            <p className="mt-2 text-[12px] text-faint">Signed with an <span className="font-mono">X-LeadVoice-Signature</span> HMAC header, so you can verify it came from us.</p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHead title="API keys" />
            <ul className="divide-y divide-line border-y border-line">
              {workspace.apiKeys.map((k) => (
                <li key={k.id} className="flex items-center gap-3 px-5 py-3">
                  <div>
                    <p className="text-[13.5px] font-medium">{k.label}</p>
                    <p className="font-mono text-[12px] text-faint">{k.prefix}••••••••</p>
                  </div>
                  <span className="ml-auto text-[12px] text-faint">{k.lastUsedAt ? `used ${ago(k.lastUsedAt)}` : "never used"}</span>
                </li>
              ))}
            </ul>
            <div className="p-5"><KeyMaker /></div>
          </Card>
          <Card>
            <CardHead title="Webhook URL" hint="where outcomes are sent" />
            <div className="px-5 pb-5"><WebhookForm current={workspace.webhookUrl ?? ""} /></div>
          </Card>
        </div>
      </div>
    </>
  );
}
