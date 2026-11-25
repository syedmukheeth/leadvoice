"use client";

import { useState, useTransition } from "react";
import { Check, Pause, Play } from "lucide-react";
import { Button, Card, CardHead, cx } from "@/components/ui";
import { VoicePlay } from "@/components/VoicePlay";
import { ACTIONS, voiceById, voicesFor } from "@/lib/catalog";
import { setAgentStatus, updateAgent } from "@/lib/actions";
import type { ActionKey, Agent } from "@/lib/types";

const field = "w-full rounded-xl border border-line bg-paper/60 px-3.5 py-2.5 text-[14px] outline-none transition focus:border-ink focus:bg-surface";
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
      <CardHead title="Train her">
        {saved && <span className="flex items-center gap-1 text-[12px] font-semibold text-live"><Check size={14} /> Saved</span>}
        <Button onClick={save} disabled={!dirty || pending} variant={dirty ? "signal" : "ghost"} className="py-2">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </CardHead>
      <div className="flex gap-1 border-b border-line px-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cx("-mb-px border-b-2 px-3 py-2.5 text-[13px] font-semibold transition", tab === t ? "border-signal text-ink" : "border-transparent text-faint hover:text-ink")}>
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
          <Label text="What she knows" hint="She only shares facts written here; anything else, she promises a callback.">
            <textarea rows={14} className={cx(field, "leading-relaxed")} value={form.knowledge} onChange={(e) => setForm({ ...form, knowledge: e.target.value })} />
          </Label>
        )}
        {tab === "Actions" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(ACTIONS) as ActionKey[]).map((k) => {
              const on = form.actions.includes(k);
              return (
                <button key={k} onClick={() => setForm({ ...form, actions: on ? form.actions.filter((x) => x !== k) : [...form.actions, k] })}
                  className={cx("flex items-start gap-3 rounded-xl border p-3 text-left transition", on ? "border-ink" : "border-line opacity-70 hover:opacity-100")}>
                  <span className={cx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border", on ? "border-ink bg-ink text-white" : "border-line-2")}>
                    {on && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold">{ACTIONS[k].label}</span>
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
              <label key={v.id} className={cx("flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition", form.voiceId === v.id ? "border-ink bg-paper" : "border-line hover:bg-paper/60")}>
                <input type="radio" className="sr-only" checked={form.voiceId === v.id} onChange={() => setForm({ ...form, voiceId: v.id })} />
                <VoicePlay voice={v.id} lang={form.language} />
                <span>
                  <span className="block text-[13.5px] font-semibold">{v.name}</span>
                  <span className="block text-[12px] text-muted">{v.gender === "female" ? "Female" : "Male"} · {v.tone}</span>
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
      <span className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold">{text}{hint && <span className="text-[12px] font-normal text-faint">{hint}</span>}</span>
      {children}
    </label>
  );
}

export function StatusToggle({ agentId, status }: { agentId: string; status: Agent["status"] }) {
  const [pending, start] = useTransition();
  const live = status === "live";
  return (
    <Button variant={live ? "ghost" : "signal"} disabled={pending} onClick={() => start(() => setAgentStatus(agentId, live ? "paused" : "live"))}>
      {live ? <><Pause size={15} /> Pause calls</> : <><Play size={15} /> Put on duty</>}
    </Button>
  );
}
