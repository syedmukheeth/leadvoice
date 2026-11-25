// Server-side voice helpers for browser test calls: Sarvam speech-to-text, Gemini replies
// and Sarvam natural voices. No phone line or LiveKit needed.
import { LANGUAGES, VOICE_MODEL, voiceById } from "./catalog";
import { setting } from "./env";
import type { Agent, Language } from "./types";

const LANG_CODE: Record<Language, string> = { te: "te-IN", hi: "hi-IN", en: "en-IN" };

export class VoiceError extends Error {}

function sarvamKey() {
  const key = setting("SARVAM_API_KEY");
  if (!key) throw new VoiceError("Add SARVAM_API_KEY to talk to your AI employee.");
  return key;
}

export async function transcribe(wav: Buffer, language: Language): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "audio.wav");
  form.append("language_code", LANG_CODE[language]);
  form.append("model", "saaras:v4");
  form.append("mode", "codemix"); // keeps English words like "site visit" readable
  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST", headers: { "api-subscription-key": sarvamKey() }, body: form, signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!res?.ok) throw new VoiceError("Couldn't hear that clearly — please say it again.");
  const data = await res.json();
  return String(data?.transcript ?? "").trim();
}

export async function speak(text: string, voiceId: string, language: Language): Promise<string> {
  const voice = voiceById(voiceId, language);
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": sarvamKey(), "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 1500), target_language_code: LANG_CODE[voice.language], speaker: voice.id, model: VOICE_MODEL, output_audio_codec: "mp3" }),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!res?.ok) return "";
  return (await res.json())?.audios?.[0] ?? "";
}

export interface Turn { who: "agent" | "customer"; text: string }
export interface Reply { reply: string; action?: string; end: boolean }

function systemPrompt(agent: Agent, business: string): string {
  const lang = LANGUAGES.find((l) => l.id === agent.language)!;
  const voice = voiceById(agent.voiceId, agent.language);
  return `You are ${agent.name}, an AI telecaller for ${business}, on a phone call. Your job: ${agent.role}
Speak ${lang.label} (${lang.native} script) the way people really talk on the phone: warm, natural, everyday words, mixing common English words like locals do. Never bookish.
You have a ${voice.gender} voice: use ${voice.gender} grammatical forms.
Keep every reply to one or two short sentences and ask one question at a time. Write numbers, prices, dates and times as words. No lists, emojis or markdown.
You are an AI assistant; say so if asked. Only share facts from KNOWLEDGE; if something isn't there, say the team will call back with it. Never pressure.
How the call should go:
${agent.script}

KNOWLEDGE:
${agent.knowledge}

A successful call ends with: ${agent.outcome}.
Reply as JSON: {"reply": what you say next, "action": short English label if you just completed an action such as "${agent.outcome}" or "Callback booked · Thu 6 PM" (else ""), "end": true only after saying goodbye}.`;
}

const MODELS = ["gemini-3.7-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash"];

export async function agentReply(agent: Agent, business: string, history: Turn[], opening: boolean): Promise<Reply> {
  const key = setting("GOOGLE_API_KEY");
  if (!key) throw new VoiceError("Add GOOGLE_API_KEY so your AI employee can think.");
  const contents = history.slice(-20).map((t) => ({ role: t.who === "agent" ? "model" : "user", parts: [{ text: t.text }] }));
  if (opening) {
    contents.push({ role: "user", parts: [{ text: `(The customer just picked up. Start the call with this opening, adapted naturally: "${agent.opening.replace("{name}", "")}")` }] });
  }
  const models = [setting("LLM_TEST_MODEL"), ...MODELS].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);
  for (const model of models) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(agent, business) }] },
        contents,
        generationConfig: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: "low" } },
      }),
      signal: AbortSignal.timeout(8000), // a busy model is skipped quickly; the next one answers
    }).catch(() => null);
    if (!res) continue;
    if (res.status === 429 || res.status >= 500) continue; // busy or out of free quota: try the next model
    if (!res.ok) continue;
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    try {
      const j = JSON.parse(text);
      const reply = String(j.reply ?? "").trim();
      if (reply) return { reply, action: String(j.action ?? "").trim() || undefined, end: Boolean(j.end) };
    } catch {
      if (text.trim()) return { reply: text.trim(), end: false };
    }
  }
  throw new VoiceError("All Gemini models are busy or out of free quota right now. Try again in a minute.");
}
