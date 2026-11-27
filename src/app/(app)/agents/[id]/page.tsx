import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { Card, CardHead, CallBadge, LeadBadge, PageHeader, cx } from "@/components/ui";
import { Waveform } from "@/components/Waveform";
import { languageById, voiceById } from "@/lib/catalog";
import { dayTime, mmss, pct } from "@/lib/format";
import { metrics, since } from "@/lib/metrics";
import { getStore } from "@/lib/store";
import { AgentEditor, StatusToggle } from "./AgentEditor";
import { TestCallButton } from "@/components/TestCallButton";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params;
  const agent = (await getStore()).agents.find((a) => a.id === id);
  return { title: agent?.name ?? "AI agent" };
}

export default async function AgentPage({ params }: PageProps<"/agents/[id]">) {
  await connection();
  const { id } = await params;
  const { agents, calls, workspace } = await getStore();
  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();
  const mine = calls.filter((c) => c.agentId === agent.id);
  const m = metrics(since(mine, 30), agents);
  const stats: [string, string][] = [
    ["Calls", String(m.calls)], ["Connect rate", pct(m.connectRate, m.calls > 0)], ["Wins", String(m.outcomes)],
    ["Average call", mmss(m.avgDurationSec)], ["Callbacks", String(m.callbacks)],
  ];

  return (
    <>
      <PageHeader
        eyebrow={`${workspace.industry}, ${languageById(agent.language).native}, ${voiceById(agent.voiceId, agent.language).name} voice`}
        title={<>{agent.name}<span className="font-normal text-faint">, goal: {agent.outcome.toLowerCase()}</span></>}
      >
        <StatusToggle agentId={agent.id} status={agent.status} />
        <TestCallButton agentId={agent.id} name={agent.name} languageLabel={languageById(agent.language).label} />
      </PageHeader>

      {/* gap-px over a line-coloured background draws hairline dividers at every breakpoint */}
      <div className="elevate mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-5">
        {stats.map(([l, v], i) => (
          <div key={l} className={cx("bg-surface p-5", i === stats.length - 1 && "max-sm:col-span-2")}>
            <p className="truncate text-[13px] text-muted">{l}</p>
            <p className={cx("mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.03em]", l === "Wins" ? "text-accent" : "text-ink")}>{v}</p>
          </div>
        ))}
        <p className="col-span-full bg-surface px-5 py-2.5 text-[12px] text-faint">Last 30 days</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <AgentEditor agent={agent} />

        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-[13px] text-muted">How {agent.name} opens the call</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">{agent.opening.replace("{name}", "Ramesh")}</p>
            <Waveform live={false} bars={40} className="mt-4" color="bg-viz-2" />
          </Card>

          <Card>
            <CardHead title="Recent calls" hint={`${mine.length} total`}>
              <Link href={`/calls?agent=${agent.id}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink">
                All <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </CardHead>
            <ul className="divide-y divide-line border-t border-line">
              {mine.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link href={`/calls?open=${c.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-ink">{c.name}</p>
                      <p className="text-[12px] text-faint">{dayTime(c.startedAt)}{c.durationSec ? `, ${mmss(c.durationSec)}` : ""}</p>
                    </div>
                    {c.outcome ? <span className="whitespace-nowrap rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent-ink">{c.outcome}</span> : <CallBadge status={c.status} />}
                    <LeadBadge status={c.leadStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
