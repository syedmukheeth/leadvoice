"use client";

import { useMemo, useState, useTransition } from "react";
import { FileUp, Plus, Search, X } from "lucide-react";
import { Button, Card, LeadBadge, cx } from "@/components/ui";
import { addLeads } from "@/lib/actions";
import { ago, maskPhone } from "@/lib/format";
import type { Agent, Lead, LeadStatus } from "@/lib/types";

type AgentLite = Pick<Agent, "id" | "name" | "status">;
const COLUMNS: { key: LeadStatus; label: string; tone: string }[] = [
  { key: "new", label: "New", tone: "bg-accent" },
  { key: "hot", label: "Hot", tone: "bg-hot" },
  { key: "warm", label: "Warm", tone: "bg-warm" },
  { key: "cold", label: "Cold", tone: "bg-cold" },
  { key: "do_not_call", label: "Do not call", tone: "bg-ink" },
];

// "Name, phone, source" per line, or a CSV with those columns (any order, header row optional).
function parseRows(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const split = (l: string) => l.split(/[,\t;]/).map((x) => x.trim().replace(/^"|"$/g, ""));
  const head = split(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = head.some((h) => ["phone", "mobile", "number", "name"].includes(h));
  const idx = (names: string[], fb: number) => { const i = head.findIndex((h) => names.includes(h)); return hasHeader && i >= 0 ? i : fb; };
  const pi = idx(["phone", "mobile", "number", "phone number"], -1), ni = idx(["name", "full name"], -1), si = idx(["source", "campaign"], -1);
  return (hasHeader ? lines.slice(1) : lines).map((l) => {
    const cells = split(l);
    const phoneCell = pi >= 0 ? cells[pi] : cells.find((c) => /\d{10}/.test(c.replace(/\D/g, ""))) ?? "";
    const nameCell = ni >= 0 ? cells[ni] : cells.find((c) => c !== phoneCell && /[^\d\s+()-]/.test(c)) ?? "";
    return { name: nameCell, phone: phoneCell, source: si >= 0 ? cells[si] : undefined };
  });
}

export function LeadsView({ leads, agents }: { leads: Lead[]; agents: AgentLite[] }) {
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const counts = useMemo(() => Object.fromEntries(COLUMNS.map((c) => [c.key, leads.filter((l) => l.status === c.key).length])), [leads]);
  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? "—";
  const list = leads.filter((l) => (status === "all" || l.status === status) &&
    (!q || `${l.name} ${l.phone} ${l.source} ${l.notes ?? ""}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((c) => (
          <button key={c.key} onClick={() => setStatus(status === c.key ? "all" : c.key)}
            aria-pressed={status === c.key}
            className={cx("rounded-xl border bg-surface p-4 text-left elevate transition-[border-color,box-shadow]", status === c.key ? "border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]" : "border-line hover:border-line-2")}>
            <span className="flex items-center gap-2 text-[13px] text-muted"><i className={cx("h-1.5 w-1.5 rounded-full", c.tone)} />{c.label}</span>
            <span className="mt-1.5 block text-[26px] font-semibold leading-none tracking-[-0.03em] text-ink">{counts[c.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 focus-within:border-line-2 sm:w-80">
          <Search size={15} strokeWidth={1.75} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint" />
        </label>
        {status !== "all" && <button onClick={() => setStatus("all")} className="rounded-lg px-2 py-1 text-[13px] font-medium text-muted hover:bg-cold-soft hover:text-ink">Clear filter</button>}
        <Button onClick={() => setAdding(true)} className="ml-auto"><Plus size={15} strokeWidth={2} /> Add leads</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13.5px]">
            <thead>
              <tr className="border-b border-line bg-paper text-left text-[12px] text-muted">
                <th className="px-5 py-2.5 font-medium">Lead</th><th className="px-3 font-medium">Status</th><th className="px-3 font-medium">Budget</th>
                <th className="px-3 font-medium">Notes</th><th className="px-3 font-medium">Next step</th><th className="px-3 font-medium">AI employee</th><th className="px-5 text-right font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.slice(0, 300).map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-paper">
                  <td className="px-5 py-3"><p className="font-medium text-ink">{l.name}</p><p className="text-[11.5px] text-faint"><span className="font-mono">{maskPhone(l.phone)}</span>, {l.source}</p></td>
                  <td className="px-3"><LeadBadge status={l.status} /></td>
                  <td className="px-3 tabular">{l.budget ?? "—"}</td>
                  <td className="max-w-[260px] px-3 text-muted"><p className="truncate">{l.notes ?? "—"}</p></td>
                  <td className="px-3 text-[12.5px]">{l.nextAction ?? <span className="text-faint">—</span>}</td>
                  <td className="px-3 text-muted">{agentName(l.agentId)}</td>
                  <td className="whitespace-nowrap px-5 text-right text-faint">{ago(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && <p className="px-5 py-12 text-center text-muted">No leads here yet.</p>}
      </Card>

      {adding && <AddLeads agents={agents} onClose={() => setAdding(false)} />}
    </>
  );
}

function AddLeads({ agents, onClose }: { agents: AgentLite[]; onClose: () => void }) {
  const [text, setText] = useState("");
  const [agentId, setAgentId] = useState(agents.find((a) => a.status === "live")?.id ?? agents[0]?.id ?? "");
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [pending, start] = useTransition();
  const rows = useMemo(() => parseRows(text), [text]);

  async function onFile(f: File | undefined) {
    if (f) setText(await f.text());
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/20 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <Card className="rise w-full max-w-[620px] p-6 shadow-[0_24px_64px_rgb(17_17_20/.16)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Add leads</h2>
            <p className="mt-1.5 text-[13.5px] text-muted">Paste numbers or upload a CSV. New leads are called within a minute during calling hours.</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-faint transition-colors hover:bg-cold-soft hover:text-ink" aria-label="Close"><X size={18} strokeWidth={1.75} /></button>
        </div>

        {result ? (
          <div className="mt-6 rounded-lg border border-live/20 bg-live-soft p-5">
            <p className="text-[18px] font-semibold tracking-[-0.02em] text-ink">{result.added} leads added</p>
            <p className="mt-1 text-[13.5px] text-muted">{result.skipped ? `${result.skipped} skipped (invalid or duplicate numbers). ` : ""}{agents.find((a) => a.id === agentId)?.name} starts calling them shortly.</p>
            <Button onClick={onClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7}
              placeholder={"Ramesh Reddy, 98480 12345, Meta ad\nSita, 9908877665\nOr paste a CSV with name, phone and source columns"}
              className="mt-5 w-full rounded-lg border border-line bg-paper px-4 py-3 font-mono text-[13px] outline-none placeholder:text-faint focus:border-line-2 focus:bg-surface" />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium transition-colors hover:border-line-2 hover:bg-paper">
                <FileUp size={15} strokeWidth={1.75} /> Upload CSV
                <input type="file" accept=".csv,.txt" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              <span className="text-[13px] text-muted">Who calls them?</span>
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px]">
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}{a.status !== "live" ? " (paused)" : ""}</option>)}
              </select>
              <Button disabled={!rows.length || pending} className="ml-auto"
                onClick={() => start(async () => setResult(await addLeads(rows, agentId)))}>
                {pending ? "Adding…" : `Add ${rows.length || ""} lead${rows.length === 1 ? "" : "s"}`}
              </Button>
            </div>
            {rows.length > 0 && (
              <p className="mt-3 text-[12px] text-faint">Preview: {rows.slice(0, 3).map((r) => `${r.name || "?"} (${r.phone || "no number"})`).join(", ")}{rows.length > 3 ? ` +${rows.length - 3} more` : ""}</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
