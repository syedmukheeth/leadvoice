import { LANGUAGES, guessTemplate, templateByKey, voiceById, voicesFor } from "./catalog";
import { setting } from "./env";
import type { ActionKey, Language } from "./types";

export interface AgentDraft {
  name: string;
  role: string;
  template: string;
  language: Language;
  voiceId: string;
  direction: "inbound" | "outbound" | "both";
  opening: string;
  script: string;
  knowledge: string;
  outcome: string;
  actions: ActionKey[];
  generatedBy: "gemini" | "template";
}

const OPENINGS: Record<Language, (name: string, biz: string) => string> = {
  te: (n, b) => `నమస్కారం {name} గారు, నేను ${b} నుంచి AI అసిస్టెంట్ ${n}. రెండు నిమిషాలు మాట్లాడొచ్చా?`,
  hi: (n, b) => `नमस्ते {name} जी, मैं ${n}, ${b} से AI असिस्टेंट बोल रही हूँ। क्या दो मिनट बात कर सकते हैं?`,
  en: (n, b) => `Hello {name}, this is ${n}, the AI assistant from ${b}. Do you have two minutes?`,
};

export function templateDraft(task: string, language: Language, templateKey: string | undefined, business: string): AgentDraft {
  const tpl = templateKey ? templateByKey(templateKey) : guessTemplate(task);
  const voice = voicesFor(language).find((v) => v.gender === "female" && !v.premium) ?? voicesFor(language)[0];
  const steps = [
    "Greet by name, say you are an AI assistant, and why you are calling.",
    ...tpl.questions.map((q) => `Find out: ${q.toLowerCase()}.`),
    "Answer questions only from the knowledge below; if unsure, promise a callback from the team.",
    `Goal: ${tpl.outcome.toLowerCase()}. Repeat the date and time back to confirm.`,
    "If they are busy, book a callback at a time they choose. Thank them and save everything.",
  ];
  return {
    name: voice.name,
    role: task.trim(),
    template: tpl.key,
    language,
    voiceId: voice.id,
    direction: tpl.direction,
    opening: OPENINGS[language](voice.name, business),
    script: steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    knowledge: "Add the facts your AI employee may share: prices, locations, timings, offers, documents needed.",
    outcome: tpl.outcome,
    actions: tpl.actions,
    generatedBy: "template",
  };
}

// Ask Gemini to turn one sentence into a complete AI employee. Falls back to the template draft.
export async function draftAgent(task: string, language: Language, templateKey: string | undefined, business: string): Promise<AgentDraft> {
  const base = templateDraft(task, language, templateKey, business);
  const key = setting("GOOGLE_API_KEY");
  if (!key) return base;
  const lang = LANGUAGES.find((l) => l.id === language)!;
  const voice = voiceById(base.voiceId, language);
  const prompt = `You design AI phone agents for Indian businesses.
Business: ${business}
Task, in the owner's words: "${task}"
Industry template: ${templateByKey(base.template).industry}
Call language: ${lang.label} (${lang.native}); natural spoken style, mixing common English words the way locals do.
The agent is called ${base.name} and speaks with a ${voice.gender} voice: use ${voice.gender} grammatical forms (e.g. Hindi "${voice.gender === "female" ? "बोल रही हूँ" : "बोल रहा हूँ"}").

Return JSON with exactly these keys:
"role": one clear sentence of what this agent does,
"opening": the first sentence the agent says, in ${lang.label} script, with {name} where the customer's name goes, giving ${voice.gender === "female" ? "her" : "his"} name (${base.name}) and saying ${voice.gender === "female" ? "she" : "he"} is an AI assistant,
"script": 5-8 numbered steps in English for how the call should go,
"knowledge": short English bullet lines of facts the business must fill in (use [brackets] for unknown values),
"outcome": 2-4 words for a successful call, e.g. "Site visit booked".`;
  const model = setting("LLM_DRAFT_MODEL") ?? "gemini-3.5-flash-lite";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.6 },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return base;
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    const g = JSON.parse(text);
    // Gemini sometimes returns lists for script / knowledge: join them into lines.
    const str = (v: unknown, fb: string) => {
      if (Array.isArray(v)) {
        v = v.filter((x): x is string => typeof x === "string")
          .map((x, i) => (/^\s*(\d+[.)]|[-•])/.test(x) ? x : `${i + 1}. ${x}`))
          .join("\n");
      }
      return typeof v === "string" && v.trim() ? v.trim() : fb;
    };
    return {
      ...base,
      role: str(g.role, base.role),
      opening: str(g.opening, base.opening),
      script: str(g.script, base.script),
      knowledge: str(g.knowledge, base.knowledge),
      outcome: str(g.outcome, base.outcome),
      generatedBy: "gemini",
    };
  } catch {
    return base;
  }
}
