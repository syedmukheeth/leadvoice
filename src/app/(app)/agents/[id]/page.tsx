import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Card, CardHead, CallBadge, LeadBadge, PageHeader } from "@/components/ui";
import { Waveform } from "@/components/Waveform";
import { languageById, templateByKey, voiceById } from "@/lib/catalog";
import { dayTime, inr, mmss, pct } from "@/lib/format";
import { metrics, since } from "@/lib/metrics";
import { getStore } from "@/lib/store";
import { AgentEditor, StatusToggle } from "./AgentEditor";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params;
  const agent = (await getStore()).agents.find((a) => a.id === id);
  return { title: agent?.name ?? "AI employee" };
}

export default async function AgentPage({ params, searchParams }: PageProps<"/agents/[id]">) {
  await connection();
  const { id } = await params;
  const { hired } = await searchParams;
  const { agents, calls } = await getStore();
  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();
  const mine = calls.filter((c) => c.agentId === agent.id);
  const m = metrics(since(mine, 30), agents);
  const tpl = templateByKey(agent.template);

  return (
    <>
      {hired && (
        <div className="rise mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-ink px-5 py-4 text-white">
          <span className="text-2xl">🎉</span>
          <p className="text-[14px]"><b>{agent.name} is hired and on duty.</b> Add leads and she starts calling within a minute, 9 AM – 9 PM.</p>
          <Link href="/leads" className="ml-auto rounded-xl bg-signal px-4 py-2 text-[13px] font-semibold text-ink">Add leads →</Link>
        </div>
      )}

      <PageHeader eyebrow={`${tpl.industry} · ${languageById(agent.language).native} · ${voiceById(agent.voiceId, agent.language).name} voice`} title={<>{agent.name} <span className="italic text-ink-3">— {agent.outcome.toLowerCase()}</span></>}>
        <StatusToggle agentId={agent.id} status={agent.status} />
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-5">
        {[
          ["Calls · 30 d", String(m.calls)], ["Connect rate", pct(m.connectRate, m.calls > 0)], [agent.outcome, String(m.outcomes)],
          ["Avg call", mmss(m.avgDurationSec)], ["Spend · 30 d", inr(m.spend)],
        ].map(([l, v]) => (
          <Card key={l} className="p-5">
            <p className="truncate text-[12.5px] text-muted">{l}</p>
            <p className="mt-2 font-display text-[38px] leading-none tabular">{v}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <AgentEditor agent={agent} />

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="bg-ink px-5 py-5 text-white">
              <p className="text-[11px] uppercase tracking-[.14em] text-white/50">How she opens</p>
              <p className="mt-2 text-[15px] leading-relaxed">{agent.opening.replace("{name}", "Ramesh")}</p>
              <Waveform live={agent.status === "live"} bars={40} className="mt-4" color="bg-signal" />
            </div>
          </Card>

          <Card>
            <CardHead title="Recent calls" hint={`${mine.length} total`}>
              <Link href={`/calls?agent=${agent.id}`} className="text-[12.5px] font-semibold text-muted hover:text-ink">All →</Link>
            </CardHead>
            <ul className="divide-y divide-line">
              {mine.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link href={`/calls?open=${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-paper/60">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium">{c.name}</p>
                      <p className="text-xs text-faint">{dayTime(c.startedAt)} · {mmss(c.durationSec)}</p>
                    </div>
                    {c.outcome ? <span className="rounded-full bg-signal-soft px-2.5 py-1 text-[11px] font-semibold">{c.outcome}</span> : <CallBadge status={c.status} />}
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
