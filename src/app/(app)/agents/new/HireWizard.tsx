"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button, Card, cx } from "@/components/ui";
import { VoicePlay } from "@/components/VoicePlay";
import { Waveform } from "@/components/Waveform";
import { ACTIONS, LANGUAGES, TEMPLATES, guessTemplate, templateByKey, voicesFor } from "@/lib/catalog";
import { createAgent } from "@/lib/actions";
import type { AgentDraft } from "@/lib/draft";
import type { ActionKey, Language } from "@/lib/types";

const field = "w-full rounded-xl border border-line bg-paper/60 px-3.5 py-2.5 text-[14px] outline-none transition focus:border-ink focus:bg-surface";

export function HireWizard() {
  const [task, setTask] = useState("");
  const [language, setLanguage] = useState<Language>("te");
  const [picked, setPicked] = useState<string | null>(null);
  const [draft, setDraft] = useState<AgentDraft | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, startSaving] = useTransition();

  const guessed = useMemo(() => (task.trim().length > 12 ? guessTemplate(task).key : null), [task]);
  const template = templateByKey(picked ?? guessed ?? TEMPLATES[0].key);

  async function generate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/agents/draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, language, template: picked ?? guessed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the draft");
      setDraft(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function set<K extends keyof AgentDraft>(k: K, v: AgentDraft[K]) {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  }

  function hire() {
    if (!draft) return;
    startSaving(() =>
      createAgent({
        name: draft.name.trim() || "Kavya", role: draft.role, template: draft.template, language: draft.language,
        voiceId: draft.voiceId, direction: draft.direction, opening: draft.opening, script: draft.script,
        knowledge: draft.knowledge, actions: draft.actions, outcome: draft.outcome,
      }),
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-[820px] pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-signal">Hire an AI employee · step 1 of 2</p>
        <h1 className="mt-2 font-display text-[54px] leading-[1.02]">What should your AI employee <span className="italic">do?</span></h1>
        <p className="mt-3 text-[15px] text-muted">One sentence is enough. We&apos;ll write the call script, pick a voice and set up the actions — you can change anything before hiring.</p>

        <Card className="mt-8 p-2 focus-within:border-ink transition">
          <textarea
            autoFocus
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && task.trim().length > 9) generate(); }}
            rows={3}
            placeholder={`e.g. ${template.example}`}
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-[18px] leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 pt-3 pb-1">
            <span className="text-[12px] font-medium text-muted mr-1">Speaks</span>
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id)}
                className={cx("rounded-full px-3.5 py-1.5 text-[13px] transition",
                  language === l.id ? "bg-ink text-white" : "bg-paper text-muted hover:text-ink")}
              >
                {l.native}{l.id !== "en" && <span className="ml-1.5 text-[11px] opacity-60">{l.label}</span>}
              </button>
            ))}
            <Button onClick={generate} disabled={loading || task.trim().length < 10} variant="signal" className="ml-auto">
              {loading ? "Writing the script…" : <>Create my AI employee <ArrowRight size={15} /></>}
            </Button>
          </div>
        </Card>
        {error && <p className="mt-3 text-sm text-hot">{error}</p>}
        {loading && (
          <div className="mt-6 flex items-center gap-4 text-muted">
            <Waveform live bars={22} color="bg-signal" />
            <span className="text-sm">Designing the conversation, choosing questions and actions…</span>
          </div>
        )}

        <p className="mt-10 mb-3 text-[12px] font-semibold uppercase tracking-[.14em] text-faint">Or start from an industry</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const active = (picked ?? guessed) === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setPicked(t.key); setTask((v) => v || t.example); }}
                className={cx("rounded-2xl border p-4 text-left transition",
                  active ? "border-ink bg-surface shadow-[0_0_0_3px_rgba(232,154,44,.25)]" : "border-line bg-surface/60 hover:border-line-2")}
              >
                <div className="flex items-center gap-2">
                  <span className={cx("rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-ink", t.accent)}>{t.industry}</span>
                  {active && guessed === t.key && !picked && <span className="text-[11px] text-signal font-semibold">matches your sentence</span>}
                </div>
                <p className="mt-2 font-semibold text-[14px]">{t.title}</p>
                <p className="mt-0.5 text-[12.5px] text-muted">Goal: {t.outcome}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const lang = LANGUAGES.find((l) => l.id === draft.language)!;
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px] pt-2">
      <div>
        <button onClick={() => setDraft(null)} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink">
          <ArrowLeft size={14} /> Change the job
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-signal">Step 2 of 2 · review</p>
        <h1 className="mt-2 font-display text-[44px] leading-[1.05]">Meet <span className="italic">{draft.name || "your new hire"}</span>.</h1>
        <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
          <Sparkles size={14} className="text-signal" />
          {draft.generatedBy === "gemini" ? "Written by AI from your sentence. Edit anything below." : "Drafted from the industry template. Edit anything below."}
        </p>

        <Card className="mt-6 divide-y divide-line">
          <Section label="Name" hint="what she calls herself on the phone">
            <input className={field} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Section>
          <Section label="The job" hint="one line, shown to your team">
            <input className={field} value={draft.role} onChange={(e) => set("role", e.target.value)} />
          </Section>
          <Section label={`First sentence · ${lang.native}`} hint="{name} becomes the customer's name">
            <textarea className={cx(field, "text-[15px] leading-relaxed")} rows={3} value={draft.opening} onChange={(e) => set("opening", e.target.value)} />
          </Section>
          <Section label="How the call goes" hint="steps she follows">
            <textarea className={cx(field, "font-mono text-[12.5px] leading-relaxed")} rows={8} value={draft.script} onChange={(e) => set("script", e.target.value)} />
          </Section>
          <Section label="What she knows" hint="prices, places, timings — she only says what's here">
            <textarea className={cx(field, "text-[13.5px] leading-relaxed")} rows={5} value={draft.knowledge} onChange={(e) => set("knowledge", e.target.value)} />
          </Section>
          <Section label="A call is a win when" hint="counted on your dashboard">
            <input className={field} value={draft.outcome} onChange={(e) => set("outcome", e.target.value)} />
          </Section>
          <Section label="What she can do mid-call">
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(ACTIONS) as ActionKey[]).map((k) => {
                const on = draft.actions.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() => set("actions", on ? draft.actions.filter((x) => x !== k) : [...draft.actions, k])}
                    className={cx("flex items-start gap-3 rounded-xl border p-3 text-left transition",
                      on ? "border-ink bg-surface" : "border-line bg-paper/50 opacity-70 hover:opacity-100")}
                  >
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
          </Section>
        </Card>
      </div>

      <aside className="xl:sticky xl:top-24 h-fit space-y-4">
        <Card className="overflow-hidden">
          <div className="bg-ink px-5 pb-5 pt-6 text-white">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-signal font-display text-3xl text-ink">{(draft.name || "K")[0]}</span>
            <p className="mt-4 font-display text-3xl leading-none">{draft.name}</p>
            <p className="mt-1.5 text-[12.5px] text-white/60">{templateByKey(draft.template).industry} · {lang.native}</p>
            <Waveform live bars={30} className="mt-4" color="bg-signal" />
          </div>
          <div className="p-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[.12em] text-faint">Voice</p>
            <div className="space-y-1.5 max-h-[300px] overflow-auto pr-1">
              {voicesFor(draft.language).map((v) => (
                <label
                  key={v.id}
                  className={cx("flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition",
                    draft.voiceId === v.id ? "border-ink bg-paper" : "border-transparent hover:bg-paper/60")}
                >
                  <input type="radio" name="voice" className="sr-only" checked={draft.voiceId === v.id} onChange={() => set("voiceId", v.id)} />
                  <VoicePlay voice={v.id} lang={draft.language} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold">{v.name} {v.premium && <span className="ml-1 rounded bg-signal-soft px-1.5 py-0.5 text-[10px] font-bold text-warm">PREMIUM</span>}</span>
                    <span className="block text-[12px] text-muted">{v.gender === "female" ? "Female" : "Male"} · {v.tone}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Card>
        <Button onClick={hire} disabled={saving} variant="primary" className="w-full py-3.5 text-[15px]">
          {saving ? "Hiring…" : <>Hire {draft.name || "her"} <ArrowRight size={16} /></>}
        </Button>
        <p className="text-center text-[12px] text-faint">You can test-call her right after hiring. Calls only start when you add leads.</p>
      </aside>
    </div>
  );
}

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 px-5 py-4 2xl:grid-cols-[190px_1fr] 2xl:gap-6">
      <div>
        <p className="text-[13px] font-semibold">{label}</p>
        {hint && <p className="mt-0.5 text-[12px] text-faint">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
