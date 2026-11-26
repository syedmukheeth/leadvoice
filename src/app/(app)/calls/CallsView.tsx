"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Search, X, Zap } from "lucide-react";
import { Card, CallBadge, LeadBadge, cx } from "@/components/ui";
import { Waveform } from "@/components/Waveform";
import { dayTime, inr, maskPhone, mmss } from "@/lib/format";
import type { Call, Language } from "@/lib/types";

type AgentLite = { id: string; name: string; outcome: string; language: Language };
const FILTERS = [
  ["all", "All"], ["win", "Wins"], ["callback", "Callbacks"], ["missed", "Not reached"], ["inbound", "Inbound"],
] as const;

export function CallsView({ calls, agents, initialAgent, initialOpen }: { calls: Call[]; agents: AgentLite[]; initialAgent: string; initialOpen: string }) {
  const [agent, setAgent] = useState(initialAgent);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Call | null>(() => calls.find((c) => c.id === initialOpen) ?? null);
  const wins = useMemo(() => new Set(agents.map((a) => a.outcome)), [agents]);
  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? "—";

  const list = useMemo(() => calls.filter((c) => {
    if (agent && c.agentId !== agent) return false;
    if (filter === "win" && !(c.outcome && wins.has(c.outcome))) return false;
    if (filter === "callback" && c.outcome !== "Callback") return false;
    if (filter === "missed" && c.status === "connected") return false;
    if (filter === "inbound" && c.direction !== "inbound") return false;
    if (q) {
      const hay = `${c.name} ${c.phone} ${c.summary ?? ""} ${c.outcome ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [calls, agent, filter, q, wins]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={cx("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition", filter === k ? "bg-ink text-white" : "bg-surface border border-line text-muted hover:text-ink")}>
            {label}
          </button>
        ))}
        <select value={agent} onChange={(e) => setAgent(e.target.value)} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] text-muted">
          <option value="">All AI employees</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <label className="ml-auto flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 focus-within:border-line-2 sm:w-72">
          <Search size={15} strokeWidth={1.75} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, number, summary" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint" />
        </label>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13.5px]">
            <thead>
              <tr className="border-b border-line bg-paper text-left text-[12px] text-muted">
                <th className="px-5 py-2.5 font-medium">When</th><th className="px-3 font-medium">Customer</th><th className="px-3 font-medium">AI employee</th>
                <th className="px-3 font-medium">Result</th><th className="px-3 font-medium">Summary</th><th className="px-5 text-right font-medium">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.slice(0, 200).map((c) => (
                <tr key={c.id} onClick={() => setOpen(c)} className="cursor-pointer transition-colors hover:bg-paper">
                  <td className="whitespace-nowrap px-5 py-3 text-muted tabular">
                    <span className="mr-2 inline-block align-middle text-faint">{c.direction === "inbound" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}</span>
                    {dayTime(c.startedAt)}
                  </td>
                  <td className="px-3 py-3"><p className="font-medium text-ink">{c.name}</p><p className="font-mono text-[11.5px] text-faint">{maskPhone(c.phone)}</p></td>
                  <td className="px-3 py-3 text-muted">{agentName(c.agentId)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.outcome && wins.has(c.outcome) ? <span className="whitespace-nowrap rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent-ink">{c.outcome}</span>
                        : c.status === "connected" ? <span className="text-[12.5px] text-muted">{c.outcome}</span> : <CallBadge status={c.status} />}
                      {c.attempt > 1 && <span className="text-[11.5px] text-faint">Attempt {c.attempt}</span>}
                    </div>
                  </td>
                  <td className="max-w-[340px] px-3 py-3 text-muted"><p className="line-clamp-2">{c.summary ?? "—"}</p></td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-muted tabular">{mmss(c.durationSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && <p className="px-5 py-12 text-center text-muted">No calls match.</p>}
      </Card>

      <div className={cx("fixed inset-0 z-30 bg-ink/20 backdrop-blur-[2px] transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setOpen(null)} />
      <aside className={cx("fixed inset-y-0 right-0 z-40 flex w-full max-w-[560px] flex-col border-l border-line bg-surface shadow-[0_0_48px_rgb(17_17_20/.12)] transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", open ? "translate-x-0" : "translate-x-full")}>
        {open && <Replay call={open} agent={agents.find((a) => a.id === open.agentId)} onClose={() => setOpen(null)} isWin={!!open.outcome && wins.has(open.outcome)} />}
      </aside>
    </>
  );
}

function Replay({ call, agent, onClose, isWin }: { call: Call; agent?: AgentLite; onClose: () => void; isWin: boolean }) {
  return (
    <>
      <div className="border-b border-line px-6 pb-5 pt-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <p className="text-[12.5px] text-muted">{call.direction === "inbound" ? "Inbound" : "Outbound"} call with {agent?.name}</p>
            <p className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink">{call.name}</p>
            <p className="mt-1 text-[12.5px] text-faint"><span className="font-mono">{call.phone}</span>, {dayTime(call.startedAt)}</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg border border-line p-1.5 text-muted transition-colors hover:border-line-2 hover:text-ink" aria-label="Close"><X size={16} strokeWidth={1.75} /></button>
        </div>
        <Waveform seed={call.id.length + call.durationSec} bars={56} className="mt-5 h-9" color={call.status === "connected" ? "bg-viz-2" : "bg-line-2"} />
        <div className="mt-1.5 flex justify-between text-[11.5px] text-faint tabular"><span>0:00</span><span>{mmss(call.durationSec)}</span></div>
      </div>

      <div className="grid grid-cols-3 gap-px border-b border-line bg-line">
        <div className="bg-surface px-5 py-3"><p className="text-[12px] text-faint">Result</p><p className="mt-1 text-[13.5px] font-medium text-ink">{call.outcome ?? (call.status === "connected" ? "—" : "Not reached")}</p></div>
        <div className="bg-surface px-5 py-3"><p className="text-[12px] text-faint">Lead</p><div className="mt-1">{call.leadStatus ? <LeadBadge status={call.leadStatus} /> : "—"}</div></div>
        <div className="bg-surface px-5 py-3"><p className="text-[12px] text-faint">Cost</p><p className="mt-1 text-[13.5px] font-medium text-ink">{inr(call.costInr, 2)}</p></div>
      </div>

      {call.summary && (
        <div className={cx("mx-5 mt-4 rounded-lg border px-4 py-3 text-[13.5px] leading-relaxed text-ink", isWin ? "border-accent/20 bg-accent-soft" : "border-line bg-paper")}>
          <p className="mb-1 text-[12px] font-medium text-muted">Summary</p>
          {call.summary}
        </div>
      )}

      <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
        {call.transcript.length ? call.transcript.map((l, i) =>
          l.who === "action" ? (
            <div key={i} className="flex items-center justify-center gap-1.5 py-1 text-[12.5px] font-medium text-accent-ink"><Zap size={13} strokeWidth={2} /> {l.text}</div>
          ) : (
            <div key={i} className={cx("flex", l.who === "agent" ? "justify-start" : "justify-end")}>
              <div className={cx("max-w-[85%] rounded-xl px-3.5 py-2.5 text-[14.5px] leading-relaxed text-ink",
                l.who === "agent" ? "rounded-bl-sm bg-cold-soft" : "rounded-br-sm border border-line bg-surface")}>
                <p className={cx("mb-0.5 text-[11.5px] font-medium", l.who === "agent" ? "text-accent-ink" : "text-faint")}>
                  {l.who === "agent" ? agent?.name : "Customer"}<span className="ml-1.5 font-normal text-faint tabular">{mmss(l.at) === "—" ? "0:00" : mmss(l.at)}</span>
                </p>
                {l.text}
              </div>
            </div>
          ),
        ) : <p className="py-10 text-center text-muted">{call.status === "voicemail" ? "Reached voicemail. Hung up and scheduled a retry." : "Not answered. Retried automatically."}</p>}
      </div>
    </>
  );
}
