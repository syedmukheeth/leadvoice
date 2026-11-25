import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { ButtonLink, Card, PageHeader, Tag } from "@/components/ui";
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
      <PageHeader eyebrow="Your team" title="AI employees">
        <ButtonLink href="/agents/new" variant="signal"><Plus size={15} strokeWidth={2.6} /> Hire a new one</ButtonLink>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-2">
        {agents.map((a, i) => {
          const m = metrics(since(calls.filter((c) => c.agentId === a.id), 30), agents);
          const tpl = templateByKey(a.template);
          return (
            <Link key={a.id} href={`/agents/${a.id}`} className="group rise" style={{ animationDelay: `${i * 70}ms` }}>
              <Card className="h-full overflow-hidden transition group-hover:border-line-2">
                <div className="relative bg-ink px-6 pt-6 pb-5 text-white">
                  <div className="flex items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-signal font-display text-3xl text-ink">{a.name[0]}</span>
                    <div className="min-w-0">
                      <p className="font-display text-[30px] leading-none">{a.name}</p>
                      <p className="mt-1.5 text-[12.5px] text-white/60">{tpl.industry} · {languageById(a.language).native} · {voiceById(a.voiceId, a.language).name} voice</p>
                    </div>
                    <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${a.status === "live" ? "bg-live text-white" : "bg-white/10 text-white/70"}`}>
                      {a.status === "live" ? "● On duty" : "Paused"}
                    </span>
                  </div>
                  <Waveform seed={i + 7} bars={44} live={a.status === "live"} className="mt-5 h-10" color={a.status === "live" ? "bg-signal" : "bg-white/20"} />
                </div>
                <div className="px-6 py-5">
                  <p className="text-[14px] leading-relaxed text-ink">{a.role}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {a.actions.slice(0, 5).map((k) => <Tag key={k}>{ACTIONS[k].label}</Tag>)}
                  </div>
                  <div className="mt-5 grid grid-cols-4 gap-3 border-t border-line pt-4">
                    {[["Calls", String(m.calls)], ["Connect", pct(m.connectRate, m.calls > 0)], [a.outcome, String(m.outcomes)], ["Spend", inr(m.spend)]].map(([l, v]) => (
                      <div key={l}>
                        <p className="font-display text-[26px] leading-none tabular">{v}</p>
                        <p className="mt-1 truncate text-[11px] text-faint">{l} · 30 d</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}

        <Link href="/agents/new" className="group">
          <div className="grid h-full min-h-[260px] place-items-center rounded-2xl border-2 border-dashed border-line-2 p-8 text-center transition group-hover:border-signal group-hover:bg-signal-soft/40">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink text-white"><Plus /></span>
              <p className="mt-4 font-display text-2xl">Hire another AI employee</p>
              <p className="mt-1 text-sm text-muted">Describe the job in one sentence. Ready in under a minute.</p>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
