import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { connection } from "next/server";
import { Funnel, Spark, TrendChart, TrendLegend } from "@/components/charts";
import { Card, CardHead, LeadBadge, PageHeader, Tag, cx } from "@/components/ui";
import { Waveform } from "@/components/Waveform";
import { languageById, voiceById } from "@/lib/catalog";
import { ago, maskPhone, mmss, num, pct, pluralOutcome } from "@/lib/format";
import { daily, metrics, since } from "@/lib/metrics";
import { getStore } from "@/lib/store";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "Overview" };

type Tone = "good" | "bad" | "neutral";

function Delta({ now, prev, upIs }: { now: number; prev: number; upIs: "good" | "bad" | "neutral" }) {
  if (!prev) return <span className="text-[12px] text-faint">No data last week</span>;
  const change = (now - prev) / prev;
  const flat = Math.abs(change) < 0.005;
  const tone: Tone = flat || upIs === "neutral" ? "neutral" : (change > 0) === (upIs === "good") ? "good" : "bad";
  const Icon = flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-1 text-[12px]">
      <span className={cx("inline-flex items-center gap-0.5 font-medium", tone === "good" ? "text-live" : tone === "bad" ? "text-hot" : "text-muted")}>
        <Icon size={13} strokeWidth={2} />
        {flat ? "0%" : `${Math.abs(Math.round(change * 100))}%`}
      </span>
      <span className="text-faint">vs last week</span>
    </span>
  );
}

export default async function Dashboard() {
  await connection(); // live numbers: render on every request
  const { agents, calls, leads } = await getStore();
  const week = since(calls, 7);
  const prev = calls.filter((c) => !week.includes(c) && since(calls, 14).includes(c));
  const m = metrics(week, agents);
  const mp = metrics(prev, agents);
  const trend = daily(calls, agents, 14);
  const hour = Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date()));
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Headline goal: the AI agent with the most wins this week.
  const winsBy = (o: string) => week.filter((c) => c.outcome === o).length;
  const mainOutcome = [...agents].sort((x, y) => winsBy(y.outcome) - winsBy(x.outcome))[0]?.outcome ?? "Outcomes";
  const mainWins = winsBy(mainOutcome);
  const hot = leads.filter((l) => l.status === "hot").slice(0, 5);
  const wins = calls.filter((c) => c.outcome && agents.some((a) => a.outcome === c.outcome)).slice(0, 5);


  const kpis = [
    { label: "Wins", value: num(m.outcomes), now: m.outcomes, prev: mp.outcomes, upIs: "good" as const,
      spark: trend.map((d) => d.outcomes), sub: `${pct(m.outcomeRate, m.connected > 0)} of connected calls` },
    { label: "Connect rate", value: pct(m.connectRate, m.calls > 0), now: m.connectRate, prev: mp.connectRate, upIs: "good" as const,
      spark: trend.map((d) => (d.calls ? d.connected / d.calls : 0)), sub: `${num(m.connected)} of ${num(m.calls)} calls answered` },
    { label: "Talk time", value: `${num(Math.round(m.minutes))} min`, now: m.minutes, prev: mp.minutes, upIs: "good" as const,
      spark: trend.map((d) => d.connected), sub: `${mmss(m.avgDurationSec)} average call` },
    { label: "Callbacks booked", value: num(m.callbacks), now: m.callbacks, prev: mp.callbacks, upIs: "good" as const,
      spark: trend.map((d) => d.connected - d.outcomes), sub: "Customers who asked to be called later" },
  ];

  return (
    <>
      <PageHeader eyebrow={`${greet}. Here is how the last 7 days went.`} title={`${pluralOutcome(mainOutcome, mainWins)} this week`}>
        <Link href="/calls" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-cold-soft hover:text-ink">
          All calls <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </PageHeader>

      {/* gap-px over a line-coloured background draws hairline dividers at every breakpoint */}
      <div className="elevate mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex min-w-0 flex-col bg-surface p-4 sm:p-5">
            <p className="text-[13px] text-muted">{k.label}</p>
            <div className="mt-1.5 flex items-end justify-between gap-3">
              <p className="text-[24px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-[30px]">{k.value}</p>
              <Spark values={k.spark} split={6} className="hidden h-8 w-24 shrink-0 sm:block" />
            </div>
            <div className="mt-3 space-y-0.5">
              <Delta now={k.now} prev={k.prev} upIs={k.upIs} />
              <p className="text-[12px] text-faint">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mb-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Card className="min-w-0">
          <CardHead title="Calls, last 14 days">
            <TrendLegend />
          </CardHead>
          <div className="overflow-x-auto px-4 pb-4 [scrollbar-width:thin]"><div className="min-w-[520px]"><TrendChart data={trend} /></div></div>
        </Card>
        <Card className="flex flex-col">
          <CardHead title="Where this week's calls went" />
          <div className="flex flex-1 flex-col px-5 pb-5 pt-1">
            <Funnel steps={[
              { label: "Dialled", value: m.calls },
              { label: "Connected", value: m.connected },
              { label: "Interested", value: week.filter((c) => c.leadStatus === "hot" || c.leadStatus === "warm").length },
              { label: mainOutcome, value: m.outcomes },
            ]} />
            <p className="mt-auto border-t border-line pt-4 text-[12.5px] leading-relaxed text-muted">
              <span className="font-medium text-ink">{m.callbacks} callbacks</span> scheduled from this week&apos;s calls.
              Unanswered numbers are retried after 2 and 4 hours.
            </p>
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Your AI agents</h2>
          <Link href="/agents" className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink">
            Manage <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {agents.map((a, i) => {
            const am = metrics(since(calls.filter((c) => c.agentId === a.id), 7), agents);
            const live = a.status === "live";
            return (
              <Link key={a.id} href={`/agents/${a.id}`} className="group rounded-xl">
                <Card className="h-full p-5 transition-colors group-hover:border-line-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cold-soft text-[14px] font-semibold text-ink">{a.name[0]}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{a.name}</p>
                      <p className="truncate text-[12px] text-faint">{languageById(a.language).label}, {voiceById(a.voiceId, a.language).name} voice</p>
                    </div>
                    <span className={cx("ml-auto rounded-full px-2 py-0.5 text-[11.5px] font-medium", live ? "bg-live-soft text-live" : "bg-cold-soft text-cold")}>
                      {live ? "On duty" : "Paused"}
                    </span>
                  </div>
                  <Waveform seed={i + 3} live={false} className="mt-4" color={live ? "bg-viz-2" : "bg-line-2"} />
                  <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{a.role}</p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3">
                    <div><dt className="text-[11.5px] text-faint">Calls</dt><dd className="text-[18px] font-semibold tracking-[-0.02em]">{am.calls}</dd></div>
                    <div><dt className="text-[11.5px] text-faint">Connect</dt><dd className="text-[18px] font-semibold tracking-[-0.02em]">{pct(am.connectRate, am.calls > 0)}</dd></div>
                    <div><dt className="text-[11.5px] text-faint">Wins</dt><dd className="text-[18px] font-semibold tracking-[-0.02em] text-accent">{am.outcomes}</dd></div>
                  </dl>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHead title="Call these first" hint="Hot leads" />
          <ul className="divide-y divide-line border-t border-line">
            {hot.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-[13.5px] font-medium text-ink">
                    {l.name}<span className="font-mono text-[11.5px] font-normal text-faint">{maskPhone(l.phone)}</span>
                  </p>
                  <p className="truncate text-[12.5px] text-muted">{l.notes}</p>
                </div>
                {l.nextAction && <Tag className="hidden sm:inline-flex">{l.nextAction}</Tag>}
                <LeadBadge status={l.status} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHead title="Latest wins" hint="Booked by your AI agents" />
          <ul className="divide-y divide-line border-t border-line">
            {wins.map((c) => (
              <li key={c.id}>
                <Link href={`/calls?open=${c.id}`} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2 text-[13.5px] font-medium text-ink">
                      {c.name}<span className="text-[11.5px] font-normal text-faint">{ago(c.startedAt)}</span>
                    </p>
                    <p className="truncate text-[12.5px] text-muted">{c.summary}</p>
                  </div>
                  <span className="hidden whitespace-nowrap rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent-ink sm:inline">{c.outcome}</span>
                  <ArrowUpRight size={15} strokeWidth={1.75} className="text-faint transition-colors group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
