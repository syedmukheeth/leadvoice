"use client";

import { useState, useTransition } from "react";
import { Check, Pause, Play } from "lucide-react";
import { Button, Card, CardHead, cx } from "@/components/ui";
import { VoicePlay } from "@/components/VoicePlay";
import { ACTIONS, voiceById, voicesFor } from "@/lib/catalog";
import { setAgentStatus, updateAgent } from "@/lib/actions";
import type { ActionKey, Agent } from "@/lib/types";

const field = "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-line-2 focus:bg-surface";
const TABS = ["Script", "Knowledge", "Actions", "Voice"] as const;

export function AgentEditor({ agent }: { agent: Agent }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Script");
  const [form, setForm] = useState(() => ({ ...agent, voiceId: voiceById(agent.voiceId, agent.language).id }));
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(form) !== JSON.stringify({ ...agent, voiceId: voiceById(agent.voiceId, agent.language).id });

  function save() {
    start(async () => {
      await updateAgent(agent.id, {
        name: form.name, role: form.role, opening: form.opening, script: form.script,
        knowledge: form.knowledge, outcome: form.outcome, voiceId: form.voiceId, actions: form.actions,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Card>
      <CardHead title="Training">
        {saved && <span className="flex items-center gap-1 text-[12.5px] font-medium text-live" role="status"><Check size={14} strokeWidth={2} /> Saved</span>}
        <Button onClick={save} disabled={!dirty || pending} variant={dirty ? "primary" : "ghost"} className="py-1.5">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </CardHead>
      <div className="flex gap-1 border-b border-line px-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={cx("-mb-px border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors", tab === t ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}>
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-4 p-5">
        {tab === "Script" && (
          <>
            <Label text="The job">
              <input className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </Label>
            <Label text="First sentence" hint="{name} = customer's name">
              <textarea rows={3} className={cx(field, "text-[15px] leading-relaxed")} value={form.opening} onChange={(e) => setForm({ ...form, opening: e.target.value })} />
            </Label>
            <Label text="How the call goes">
              <textarea rows={9} className={cx(field, "font-mono text-[12.5px] leading-relaxed")} value={form.script} onChange={(e) => setForm({ ...form, script: e.target.value })} />
            </Label>
            <Label text="A call is a win when">
              <input className={field} value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
            </Label>
          </>
        )}
        {tab === "Knowledge" && (
          <Label text="Knowledge" hint="Only facts written here are shared. Anything else gets a callback.">
            <textarea rows={14} className={cx(field, "leading-relaxed")} value={form.knowledge} onChange={(e) => setForm({ ...form, knowledge: e.target.value })} />
          </Label>
        )}
        {tab === "Actions" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(ACTIONS) as ActionKey[]).map((k) => {
              const on = form.actions.includes(k);
              return (
                <button key={k} onClick={() => setForm({ ...form, actions: on ? form.actions.filter((x) => x !== k) : [...form.actions, k] })}
                  aria-pressed={on}
                  className={cx("flex items-start gap-3 rounded-lg border p-3 text-left transition-colors", on ? "border-line-2 bg-surface" : "border-line bg-paper text-muted hover:border-line-2")}>
                  <span className={cx("mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-[5px] border", on ? "border-accent bg-accent text-white" : "border-line-2 bg-surface")}>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-ink">{ACTIONS[k].label}</span>
                    <span className="block text-[12px] text-muted">{ACTIONS[k].hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {tab === "Voice" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {voicesFor(form.language).map((v) => (
              <label key={v.id} className={cx("flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors", form.voiceId === v.id ? "border-accent bg-accent-soft" : "border-line hover:bg-paper")}>
                <input type="radio" className="sr-only" checked={form.voiceId === v.id} onChange={() => setForm({ ...form, voiceId: v.id })} />
                <VoicePlay voice={v.id} lang={form.language} />
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink">{v.name}</span>
                  <span className="block text-[12px] text-muted">{v.gender === "female" ? "Female" : "Male"}, {v.tone.charAt(0).toLowerCase() + v.tone.slice(1)}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function Label({ text, hint, children }: { text: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-baseline gap-x-2 text-[13px] font-semibold text-ink">{text}{hint && <span className="text-[12px] font-normal text-faint">{hint}</span>}</span>
      {children}
    </label>
  );
}

export function StatusToggle({ agentId, status }: { agentId: string; status: Agent["status"] }) {
  const [pending, start] = useTransition();
  const live = status === "live";
  return (
    <Button variant={live ? "ghost" : "primary"} disabled={pending} onClick={() => start(() => setAgentStatus(agentId, live ? "paused" : "live"))}>
      {live ? <><Pause size={15} /> Pause calls</> : <><Play size={15} /> Put on duty</>}
    </Button>
  );
}
