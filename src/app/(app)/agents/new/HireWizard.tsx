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

const field = "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-line-2 focus:bg-surface";

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
        <p className="text-[13px] text-muted">Hire an AI employee, step 1 of 2</p>
        <h1 className="mt-1.5 text-[32px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[36px]">What should your AI employee do?</h1>
        <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted">One sentence is enough. We write the call script, pick a voice and set up the actions. You can change anything before hiring.</p>

        <Card className="mt-8 p-2 transition-[border-color,box-shadow] focus-within:border-line-2 focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)]">
          <textarea
            autoFocus
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && task.trim().length > 9) generate(); }}
            rows={3}
            placeholder={`e.g. ${template.example}`}
            className="w-full resize-none rounded-lg bg-transparent px-4 py-3 text-[17px] leading-relaxed text-ink outline-none placeholder:text-faint"
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 pt-3 pb-1">
            <span className="mr-1 text-[12.5px] text-muted">Speaks</span>
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id)}
                aria-pressed={language === l.id}
                className={cx("rounded-full px-3 py-1 text-[13px] transition-colors",
                  language === l.id ? "bg-ink text-white" : "bg-cold-soft text-muted hover:text-ink")}
              >
                {l.native}{l.id !== "en" && <span className="ml-1.5 text-[11px] opacity-60">{l.label}</span>}
              </button>
            ))}
            <Button onClick={generate} disabled={loading || task.trim().length < 10} className="ml-auto">
              {loading ? "Writing the script…" : <>Create AI employee <ArrowRight size={15} strokeWidth={2} /></>}
            </Button>
          </div>
        </Card>
        {error && <p className="mt-3 text-sm text-hot">{error}</p>}
        {loading && (
          <div className="mt-6 flex items-center gap-4 text-muted">
            <Waveform live bars={22} color="bg-viz-2" />
            <span className="text-[13.5px]">Writing the conversation, choosing questions and actions…</span>
          </div>
        )}

        <p className="mt-10 mb-3 text-[14px] font-semibold text-ink">Or start from an industry</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const active = (picked ?? guessed) === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setPicked(t.key); setTask((v) => v || t.example); }}
                aria-pressed={active}
                className={cx("rounded-xl border bg-surface p-4 text-left transition-[border-color,box-shadow]",
                  active ? "border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]" : "border-line hover:border-line-2")}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-cold-soft px-2 py-0.5 text-[11.5px] font-medium text-muted">{t.industry}</span>
                  {active && guessed === t.key && !picked && <span className="text-[12px] font-medium text-accent-ink">Matches your sentence</span>}
                </div>
                <p className="mt-2 text-[14px] font-semibold text-ink">{t.title}</p>
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
        <button onClick={() => setDraft(null)} className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-[13px] font-medium text-muted transition-colors hover:bg-cold-soft hover:text-ink">
          <ArrowLeft size={14} strokeWidth={2} /> Change the job
        </button>
        <p className="text-[13px] text-muted">Step 2 of 2, review</p>
        <h1 className="mt-1.5 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink">Meet {draft.name || "your new hire"}</h1>
        <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
          <Sparkles size={14} strokeWidth={1.75} className="text-accent" />
          {draft.generatedBy === "gemini" ? "Written by AI from your sentence. Edit anything below." : "Drafted from the industry template. Edit anything below."}
        </p>

        <Card className="mt-6 divide-y divide-line">
          <Section label="Name" hint="Used on the phone">
            <input className={field} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Section>
          <Section label="The job" hint="One line, shown to your team">
            <input className={field} value={draft.role} onChange={(e) => set("role", e.target.value)} />
          </Section>
          <Section label={`First sentence (${lang.native})`} hint="{name} becomes the customer's name">
            <textarea className={cx(field, "text-[15px] leading-relaxed")} rows={3} value={draft.opening} onChange={(e) => set("opening", e.target.value)} />
          </Section>
          <Section label="How the call goes" hint="Steps to follow, in order">
            <textarea className={cx(field, "font-mono text-[12.5px] leading-relaxed")} rows={8} value={draft.script} onChange={(e) => set("script", e.target.value)} />
          </Section>
          <Section label="Knowledge" hint="Prices, places, timings. Only what is written here is said.">
            <textarea className={cx(field, "text-[13.5px] leading-relaxed")} rows={5} value={draft.knowledge} onChange={(e) => set("knowledge", e.target.value)} />
          </Section>
          <Section label="A call is a win when" hint="Counted on your dashboard">
            <input className={field} value={draft.outcome} onChange={(e) => set("outcome", e.target.value)} />
          </Section>
          <Section label="Actions during the call">
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(ACTIONS) as ActionKey[]).map((k) => {
                const on = draft.actions.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() => set("actions", on ? draft.actions.filter((x) => x !== k) : [...draft.actions, k])}
                    aria-pressed={on}
                    className={cx("flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      on ? "border-line-2 bg-surface" : "border-line bg-paper text-muted hover:border-line-2")}
                  >
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
          </Section>
        </Card>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-20">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 pb-5 pt-5">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-cold-soft text-[18px] font-semibold text-ink">{(draft.name || "K")[0]}</span>
            <p className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-ink">{draft.name}</p>
            <p className="mt-0.5 text-[12.5px] text-muted">{templateByKey(draft.template).industry}, {lang.native}</p>
            <Waveform bars={30} className="mt-4" color="bg-viz-2" />
          </div>
          <div className="p-4">
            <p className="mb-2 text-[13px] font-semibold text-ink">Voice</p>
            <div className="space-y-1.5 max-h-[300px] overflow-auto pr-1">
              {voicesFor(draft.language).map((v) => (
                <label
                  key={v.id}
                  className={cx("flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                    draft.voiceId === v.id ? "border-accent bg-accent-soft" : "border-transparent hover:bg-paper")}
                >
                  <input type="radio" name="voice" className="sr-only" checked={draft.voiceId === v.id} onChange={() => set("voiceId", v.id)} />
                  <VoicePlay voice={v.id} lang={draft.language} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-ink">{v.name} {v.premium && <span className="ml-1 rounded-full border border-line px-1.5 py-px text-[10.5px] font-medium text-muted">Premium</span>}</span>
                    <span className="block text-[12px] text-muted">{v.gender === "female" ? "Female" : "Male"}, {v.tone.charAt(0).toLowerCase() + v.tone.slice(1)}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Card>
        <Button onClick={hire} disabled={saving} variant="primary" className="w-full py-3 text-[14.5px]">
          {saving ? "Hiring…" : <>Hire {draft.name || "this AI employee"} <ArrowRight size={16} strokeWidth={2} /></>}
        </Button>
        <p className="text-center text-[12.5px] text-faint">You can test-call {draft.name || "them"} right after hiring. Calls only start when you add leads.</p>
      </aside>
    </div>
  );
}

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 px-5 py-4 2xl:grid-cols-[190px_1fr] 2xl:gap-6">
      <div>
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-[12px] text-faint">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
