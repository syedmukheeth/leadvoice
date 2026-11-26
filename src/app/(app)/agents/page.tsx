import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { Card, PageHeader, Tag, cx } from "@/components/ui";
import { Waveform } from "@/components/Waveform";
import { ACTIONS, languageById, templateByKey, voiceById } from "@/lib/catalog";
import { inr, pct } from "@/lib/format";
import { metrics, since } from "@/lib/metrics";
import { getStore } from "@/lib/store";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "AI employees" };

export default async function AgentsPage() {
  await connection();
  const { agents, calls } = await getStore();
  return (
    <>
      <PageHeader eyebrow="Numbers cover the last 30 days" title="AI employees" />

      <div className="grid gap-5 lg:grid-cols-2">
        {agents.map((a, i) => {
          const m = metrics(since(calls.filter((c) => c.agentId === a.id), 30), agents);
          const tpl = templateByKey(a.template);
          const live = a.status === "live";
          return (
            <Link key={a.id} href={`/agents/${a.id}`} className="group rounded-xl">
              <Card className="flex h-full flex-col p-6 transition-colors group-hover:border-line-2">
                <div className="flex items-start gap-3.5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-cold-soft text-[17px] font-semibold text-ink">{a.name[0]}</span>
                  <div className="min-w-0">
                    <p className="text-[17px] font-semibold tracking-[-0.015em] text-ink">{a.name}</p>
                    <p className="mt-0.5 text-[12.5px] text-faint">
                      {tpl.industry}, <span className="font-medium">{languageById(a.language).native}</span>, {voiceById(a.voiceId, a.language).name} voice
                    </p>
                  </div>
                  <span className={cx("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium", live ? "bg-live-soft text-live" : "bg-cold-soft text-cold")}>
                    {live ? "On duty" : "Paused"}
                  </span>
                </div>
                <Waveform seed={i + 7} bars={44} live={false} className="mt-5 h-8" color={live ? "bg-viz-2" : "bg-line-2"} />
                <p className="mt-4 text-[14px] leading-relaxed text-ink-3">{a.role}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {a.actions.slice(0, 5).map((k) => <Tag key={k}>{ACTIONS[k].label}</Tag>)}
                </div>
                <div className="min-h-5 flex-1" />
                <dl className="grid grid-cols-4 gap-3 border-t border-line pt-4">
                  {[["Calls", String(m.calls)], ["Connect", pct(m.connectRate, m.calls > 0)], ["Wins", String(m.outcomes)], ["Spend", inr(m.spend)]].map(([l, v]) => (
                    <div key={l} className="min-w-0">
                      <dt className="truncate text-[11.5px] text-faint">{l}</dt>
                      <dd className={cx("text-[18px] font-semibold tracking-[-0.02em]", l === "Wins" ? "text-accent" : "text-ink")}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </Link>
          );
        })}

        <Link href="/agents/new" className="group rounded-xl">
          <div className="grid h-full min-h-[240px] place-items-center rounded-xl border border-dashed border-line-2 p-8 text-center transition-colors group-hover:border-accent group-hover:bg-accent-soft/50">
            <div>
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-ink text-white"><Plus size={18} strokeWidth={2} /></span>
              <p className="mt-4 text-[15px] font-semibold text-ink">Hire another AI employee</p>
              <p className="mt-1 text-[13.5px] text-muted">Describe the job in one sentence. Ready in under a minute.</p>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
