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
        <label className="ml-auto flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 sm:w-72">
          <Search size={15} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, number, summary" className="w-full bg-transparent text-[13.5px] outline-none" />
        </label>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13.5px]">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-left text-[11px] uppercase tracking-[.1em] text-faint">
                <th className="px-5 py-3 font-semibold">When</th><th className="px-3 font-semibold">Customer</th><th className="px-3 font-semibold">Agent</th>
                <th className="px-3 font-semibold">Result</th><th className="px-3 font-semibold">Summary</th><th className="px-5 text-right font-semibold">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.slice(0, 200).map((c) => (
                <tr key={c.id} onClick={() => setOpen(c)} className="cursor-pointer transition hover:bg-paper/70">
                  <td className="whitespace-nowrap px-5 py-3 text-muted tabular">
                    <span className="mr-2 inline-block align-middle text-faint">{c.direction === "inbound" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}</span>
                    {dayTime(c.startedAt)}
                  </td>
                  <td className="px-3 py-3"><p className="font-medium">{c.name}</p><p className="font-mono text-[11.5px] text-faint">{maskPhone(c.phone)}</p></td>
                  <td className="px-3 py-3 text-muted">{agentName(c.agentId)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.outcome && wins.has(c.outcome) ? <span className="rounded-full bg-signal-soft px-2.5 py-1 text-[11px] font-semibold">{c.outcome}</span>
                        : c.status === "connected" ? <span className="text-[12.5px] text-muted">{c.outcome}</span> : <CallBadge status={c.status} />}
                      {c.attempt > 1 && <span className="text-[11px] text-faint">try {c.attempt}</span>}
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

      <div className={cx("fixed inset-0 z-30 bg-ink/30 transition", open ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setOpen(null)} />
      <aside className={cx("fixed inset-y-0 right-0 z-40 flex w-full max-w-[560px] flex-col bg-surface shadow-2xl transition-transform duration-300", open ? "translate-x-0" : "translate-x-full")}>
        {open && <Replay call={open} agent={agents.find((a) => a.id === open.agentId)} onClose={() => setOpen(null)} isWin={!!open.outcome && wins.has(open.outcome)} />}
      </aside>
    </>
  );
}

function Replay({ call, agent, onClose, isWin }: { call: Call; agent?: AgentLite; onClose: () => void; isWin: boolean }) {
  return (
    <>
      <div className="bg-ink px-6 pb-5 pt-5 text-white">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[.14em] text-white/50">{call.direction === "inbound" ? "Inbound" : "Outbound"} · {agent?.name}</p>
            <p className="mt-1 font-display text-[32px] leading-none">{call.name}</p>
            <p className="mt-1.5 font-mono text-[12px] text-white/60">{call.phone} · {dayTime(call.startedAt)}</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg border border-white/20 p-1.5 hover:border-white/50" aria-label="Close"><X size={16} /></button>
        </div>
        <Waveform seed={call.id.length + call.durationSec} bars={56} className="mt-5 h-10" color={call.status === "connected" ? "bg-signal" : "bg-white/20"} />
        <div className="mt-2 flex justify-between text-[11px] text-white/45 tabular"><span>0:00</span><span>{mmss(call.durationSec)}</span></div>
      </div>

      <div className="grid grid-cols-3 border-b border-line text-center">
        <div className="px-3 py-3"><p className="text-[11px] text-faint">Result</p><p className="mt-1 text-[13px] font-semibold">{call.outcome ?? (call.status === "connected" ? "—" : "Not reached")}</p></div>
        <div className="border-x border-line px-3 py-3"><p className="text-[11px] text-faint">Lead</p><div className="mt-1">{call.leadStatus ? <LeadBadge status={call.leadStatus} /> : "—"}</div></div>
        <div className="px-3 py-3"><p className="text-[11px] text-faint">Cost</p><p className="mt-1 text-[13px] font-semibold tabular">{inr(call.costInr, 2)}</p></div>
      </div>

      {call.summary && (
        <div className={cx("mx-5 mt-4 rounded-xl px-4 py-3 text-[13.5px] leading-relaxed", isWin ? "bg-signal-soft" : "bg-paper")}>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.12em] text-faint">Summary</p>
          {call.summary}
        </div>
      )}

      <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
        {call.transcript.length ? call.transcript.map((l, i) =>
          l.who === "action" ? (
            <div key={i} className="flex items-center justify-center gap-1.5 py-1 text-[12px] font-semibold text-live"><Zap size={13} /> {l.text}</div>
          ) : (
            <div key={i} className={cx("flex", l.who === "agent" ? "justify-start" : "justify-end")}>
              <div className={cx("max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed",
                l.who === "agent" ? "rounded-bl-md bg-ink text-white" : "rounded-br-md border border-line bg-surface")}>
                <p className={cx("mb-0.5 text-[10px] font-semibold uppercase tracking-[.12em]", l.who === "agent" ? "text-signal" : "text-faint")}>
                  {l.who === "agent" ? agent?.name : "Customer"} · {mmss(l.at) === "—" ? "0:00" : mmss(l.at)}
                </p>
                {l.text}
              </div>
            </div>
          ),
        ) : <p className="py-10 text-center text-muted">{call.status === "voicemail" ? "Reached voicemail — hung up and scheduled a retry." : "Not answered — retried automatically."}</p>}
      </div>
    </>
  );
}
