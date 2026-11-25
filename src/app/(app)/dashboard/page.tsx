import Link from "next/link";
import { ArrowUpRight, Flame } from "lucide-react";
import { Funnel, Spark, TrendChart } from "@/components/charts";
import { Card, CardHead, LeadBadge, PageHeader, Tag } from "@/components/ui";
import { Waveform } from "@/components/Waveform";
import { languageById, voiceById } from "@/lib/catalog";
import { ago, inr, maskPhone, num, pct } from "@/lib/format";
import { daily, metrics, since } from "@/lib/metrics";
import { getStore } from "@/lib/store";
import { connection } from "next/server";
import { pluralOutcome } from "@/lib/format";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "Overview" };

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
  // Headline goal: the AI employee with the most wins this week (falls back to the first on duty).
  const winsBy = (o: string) => week.filter((c) => c.outcome === o).length;
  const mainOutcome = [...agents].sort((x, y) => winsBy(y.outcome) - winsBy(x.outcome))[0]?.outcome ?? "Outcomes";
  const mainWins = winsBy(mainOutcome);
  const hot = leads.filter((l) => l.status === "hot").slice(0, 6);
  const wins = calls.filter((c) => c.outcome && agents.some((a) => a.outcome === c.outcome)).slice(0, 6);

  const kpis = [
    { label: "Outcomes", value: num(m.outcomes), prev: mp.outcomes, now: m.outcomes, spark: trend.map((d) => d.outcomes), sub: `${pct(m.outcomeRate)} of connected calls` },
    { label: "Connect rate", value: pct(m.connectRate), prev: mp.connectRate, now: m.connectRate, spark: trend.map((d) => (d.calls ? d.connected / d.calls : 0)), sub: `${num(m.connected)} of ${num(m.calls)} calls` },
    { label: "Spend", value: inr(m.spend), prev: mp.spend, now: m.spend, spark: trend.map((d) => d.connected), sub: `${num(Math.round(m.minutes))} talk minutes` },
    { label: "Cost per outcome", value: m.outcomes ? inr(m.costPerOutcome) : "—", prev: mp.costPerOutcome, now: m.costPerOutcome, invert: true, spark: trend.map((d) => d.outcomes), sub: "what each booking cost you" },
  ];

  return (
    <>
      <PageHeader eyebrow="Overview · last 7 days" title={<>{greet}. <span className="italic text-ink-3">{pluralOutcome(mainOutcome, mainWins)}</span> this week.</>}>
        <Link href="/calls" className="text-[13px] font-semibold text-muted hover:text-ink">All calls →</Link>
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        {kpis.map((k, i) => {
          const change = k.prev ? (k.now - k.prev) / k.prev : 0;
          const good = k.invert ? change <= 0 : change >= 0;
          return (
            <Card key={k.label} className="rise p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between">
                <p className="text-[12.5px] font-medium text-muted">{k.label}</p>
                {k.prev ? (
                  <span className={`text-[11px] font-semibold tabular ${good ? "text-live" : "text-hot"}`}>
                    {change >= 0 ? "▲" : "▼"} {Math.abs(Math.round(change * 100))}%
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-display text-[44px] leading-none tabular">{k.value}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-xs text-faint">{k.sub}</p>
                <Spark values={k.spark} className="h-7 w-24 text-signal shrink-0" />
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr] mb-5">
        <Card>
          <CardHead title="Last 14 days" hint="calls · connected · outcomes">
            <span className="flex items-center gap-3 text-[11px] text-muted">
              <i className="h-2.5 w-2.5 rounded-sm bg-[#dfe5de]" />Calls
              <i className="h-2.5 w-2.5 rounded-sm bg-ink-2" />Connected
              <i className="h-0.5 w-3 bg-signal" />Outcomes
            </span>
          </CardHead>
          <div className="px-4 pb-4"><TrendChart data={trend} /></div>
        </Card>
        <Card>
          <CardHead title="Where calls go" hint="this week" />
          <div className="px-5 pb-6 pt-1">
            <Funnel steps={[
              { label: "Dialled", value: m.calls },
              { label: "Connected", value: m.connected },
              { label: "Interested", value: week.filter((c) => c.leadStatus === "hot" || c.leadStatus === "warm").length },
              { label: mainOutcome, value: m.outcomes },
            ]} />
            <p className="mt-5 rounded-xl bg-paper px-4 py-3 text-[12.5px] text-muted leading-relaxed">
              <b className="text-ink">{m.callbacks} callbacks</b> are scheduled from this week&apos;s calls. Unanswered numbers are retried at 2 h and 4 h automatically.
            </p>
          </div>
        </Card>
      </section>

      <section className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13.5px] font-semibold">Your AI employees</h2>
          <Link href="/agents" className="text-[12.5px] font-semibold text-muted hover:text-ink">Manage →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {agents.map((a, i) => {
            const am = metrics(since(calls.filter((c) => c.agentId === a.id), 7), agents);
            return (
              <Link key={a.id} href={`/agents/${a.id}`} className="group">
                <Card className="h-full p-5 transition group-hover:border-line-2 group-hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-display text-lg text-white">{a.name[0]}</span>
                    <div className="min-w-0">
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-xs text-faint">{languageById(a.language).label} · {voiceById(a.voiceId, a.language).name} voice</p>
                    </div>
                    <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold ${a.status === "live" ? "bg-live-soft text-live" : "bg-cold-soft text-cold"}`}>
                      {a.status === "live" ? "On duty" : "Paused"}
                    </span>
                  </div>
                  <Waveform seed={i + 3} live={a.status === "live"} className="mt-4" color={a.status === "live" ? "bg-ink-2" : "bg-line-2"} />
                  <p className="mt-3 line-clamp-2 text-[13px] text-muted">{a.role}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                    <div><p className="font-display text-2xl tabular">{am.calls}</p><p className="text-[11px] text-faint">calls</p></div>
                    <div><p className="font-display text-2xl tabular">{pct(am.connectRate, am.calls > 0)}</p><p className="text-[11px] text-faint">connect</p></div>
                    <div><p className="font-display text-2xl tabular text-signal">{am.outcomes}</p><p className="text-[11px] text-faint">{a.outcome.split(" ").slice(-1)[0].toLowerCase()}</p></div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Call these first" hint="hot leads">
            <Flame size={15} className="text-hot" />
          </CardHead>
          <ul className="divide-y divide-line">
            {hot.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.name} <span className="font-mono text-xs text-faint">{maskPhone(l.phone)}</span></p>
                  <p className="truncate text-xs text-muted">{l.notes}</p>
                </div>
                {l.nextAction && <Tag>{l.nextAction}</Tag>}
                <LeadBadge status={l.status} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHead title="Latest wins" hint="booked by your AI employees" />
          <ul className="divide-y divide-line">
            {wins.map((c) => (
              <li key={c.id}>
                <Link href={`/calls?open=${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-paper/60">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.name} <span className="text-xs font-normal text-faint">· {ago(c.startedAt)}</span></p>
                    <p className="truncate text-xs text-muted">{c.summary}</p>
                  </div>
                  <span className="rounded-full bg-signal-soft px-2.5 py-1 text-[11px] font-semibold text-ink">{c.outcome}</span>
                  <ArrowUpRight size={15} className="text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
