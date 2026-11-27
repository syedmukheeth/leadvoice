// Server-side voice helpers for browser test calls: Sarvam speech-to-text, Gemini replies
// and Sarvam natural voices. No phone line or LiveKit needed.
import { LANGUAGES, VOICE_MODEL, voiceById } from "./catalog";
import { setting } from "./env";
import { namesIn } from "./names";
import { forSpeech } from "./pronounce";
import { REST_MS, createCooldown } from "./cooldown";
import type { Agent, Language } from "./types";

const LANG_CODE: Record<Language, string> = { te: "te-IN", hi: "hi-IN", en: "en-IN" };

// `setup` marks errors only an admin can fix (missing or rejected keys): the call stops instead of retrying.
export class VoiceError extends Error {
  setup: boolean;
  constructor(message: string, setup = false) {
    super(message);
    this.setup = setup;
  }
}

// Which keys this server is missing for browser calls (names only, never values).
export function missingVoiceKeys(): string[] {
  return ["GOOGLE_API_KEY", "SARVAM_API_KEY"].filter((k) => !setting(k));
}

function sarvamKey() {
  const key = setting("SARVAM_API_KEY");
  if (!key) throw new VoiceError("Add SARVAM_API_KEY to talk to your AI agent.", true);
  return key;
}

export async function transcribe(wav: Buffer, language: Language): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "audio.wav");
  form.append("language_code", LANG_CODE[language]);
  form.append("model", "saaras:v4");
  form.append("mode", "codemix"); // keeps English words like "site visit" readable
  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST", headers: { "api-subscription-key": sarvamKey() }, body: form, signal: AbortSignal.timeout(12000),
  }).catch(() => null);
  if (!res?.ok) throw new VoiceError("Couldn't hear that clearly. Please say it again.");
  const data = await res.json();
  return String(data?.transcript ?? "").trim();
}

export async function speak(text: string, voiceId: string, language: Language): Promise<string> {
  const voice = voiceById(voiceId, language);
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": sarvamKey(), "Content-Type": "application/json" },
    body: JSON.stringify({ text: forSpeech(text, voice.language).slice(0, 1500), target_language_code: LANG_CODE[voice.language], speaker: voice.id, model: VOICE_MODEL, output_audio_codec: "mp3" }),
    signal: AbortSignal.timeout(12000),
  }).catch(() => null);
  if (!res?.ok) return "";
  return (await res.json())?.audios?.[0] ?? "";
}

export interface Turn { who: "agent" | "customer"; text: string }
export interface Reply { reply: string; action?: string; end: boolean }

// How each language is really spoken on an Indian sales call. Telugu, Hindi and English each get
// their own reactions, politeness and goodbyes, so no language borrows another's habits.
const STYLE: Record<Language, string> = {
  te: `Speak everyday spoken Telugu, the way people in Andhra and Telangana talk on the phone: warm, simple, never bookish. Mix common English words like locals do (site visit, plot, budget, location).
Polite forms: add "అండి" naturally, and "గారు" after a person's name. Short reactions to start a reply: "అవునండి", "అర్థమైంది", "సరే అండి", "అలాగా", "తప్పకుండా".
If they are busy: "పర్వాలేదండి, ఎప్పుడు కాల్ చేయమంటారు?". Goodbye: "సరే అండి, ధన్యవాదాలు. మంచి రోజు అండి!"`,
  hi: `Speak everyday spoken Hindi, the way a polite person talks on a phone call in India: natural Hinglish, never shuddh or bookish Hindi. Use common English words as people do (loan, documents, upload, EMI, site visit) instead of formal words like दस्तावेज़ or ऋण.
Always "आप", add "जी" after names. Short reactions to start a reply: "जी", "हाँ जी", "अच्छा", "बिल्कुल", "ठीक है", "समझ गई" (female) / "समझ गया" (male).
If they are busy: "कोई बात नहीं जी, मैं कब कॉल करूँ?". Goodbye: "ठीक है जी, धन्यवाद। आपका दिन अच्छा रहे!"`,
  en: `Speak friendly, simple Indian English, like a helpful person at a local office: short sentences, contractions (I'll, you're), no slang and no stiff phrases like "I understand your concern", "kindly" or "please be informed".
Use "sir" or "ma'am" now and then. Short reactions to start a reply: "Sure", "Got it", "Absolutely", "Okay", "No problem", "Great".
If they are busy: "No problem at all, when should I call you back?". Goodbye: "Thank you, have a great day!"`,
};

function nowInIndia() {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date());
}

function systemPrompt(agent: Agent, business: string): string {
  const lang = LANGUAGES.find((l) => l.id === agent.language)!;
  const voice = voiceById(agent.voiceId, agent.language);
  const names = namesIn(`${business}
${agent.knowledge}`);
  return `You are ${agent.name}, a ${voice.gender} telecaller for ${business}, on a live phone call. Your job: ${agent.role}
It is now ${nowInIndia()} in India; use this for "today", "tomorrow" and "this Sunday".

HOW YOU SPEAK
${STYLE[agent.language]}${agent.language === "en" ? "" : `
Write in ${lang.native} script. Only English words and names stay in English letters, copied exactly (for example: site visit, plot, Kurnool).`}
Use ${voice.gender} grammatical forms for yourself.
One or two short sentences per reply (under 30 words), one question at a time. Numbers, prices, dates and times as words; units in full (square yards). No lists, emojis or markdown.
Start most replies with a short reaction that fits what they just said (never a cheerful "no problem" or "great" to a request you have to turn down), and never open two replies the same way. Use their name or sir/madam only now and then.

BE AWARE OF THE CONVERSATION
- Before replying, recall what the customer has already told you (name, need, budget, size, timing, worries). Use it, and never ask for it again.
- Answer what they asked first, then move the call one step towards the goal.
- Never repeat your introduction after the first line. If they only say hello, reply briefly and carry on.
- If they switch language, reply in their language.
- If what they said is unclear or cut off, ask them to repeat in a few words.
- If they are busy, fix a callback time at once. If they want a person, say the team will call back and agree a time.
- If they push back on price or doubt you, stay calm: acknowledge it, give one true fact from KNOWLEDGE, and offer a site visit or callback. Never argue.
- Make an offer (like a site visit) once, then let them lead; never repeat the same question or offer in back-to-back replies.
- When the goal is agreed, confirm the details once, say what happens next (for example the location or a reminder on WhatsApp), and ask if there's anything else before saying goodbye.
- You are an AI assistant: say so if asked, never announce it otherwise. Never pressure.

How the call should go:
${agent.script}

KNOWLEDGE (the only facts you may share):
${agent.knowledge}
${names.length && agent.language !== "en" ? `
NAMES: always write these in English letters, exactly like this: ${names.join(", ")}
` : ""}
A successful call ends with: ${agent.outcome}.
STRICT: never invent products, prices, places, offers or features. If KNOWLEDGE doesn't say it, say the team will confirm it.
Reply as JSON: {"reply": what you say next, "action": short English label ONLY in the one reply where an action is truly finished with its details agreed (for example "${agent.outcome}" once the day and time are confirmed, or "Callback booked · Thu 6 PM" once the customer gave a time); otherwise "" and never repeat an action already reported, "end": true only after saying goodbye}.`;
}

// Fast Lite models first: they answer in about 2 s and keep names right thanks to the NAMES list.
// The bigger Flash models are often overloaded on the free tier (8 s timeouts), so they are the backup.
const MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.8-flash"];
const PER_MODEL_MS = 6000;
const TOTAL_BUDGET_MS = 16000; // stop trying more models after this: a caller won't wait longer
const cooldown = createCooldown();

export async function agentReply(agent: Agent, business: string, history: Turn[], opening: boolean): Promise<Reply> {
  const key = setting("GOOGLE_API_KEY");
  if (!key) throw new VoiceError("Add GOOGLE_API_KEY so your AI agent can think.", true);
  const contents = history.slice(-20).map((t) => ({ role: t.who === "agent" ? "model" : "user", parts: [{ text: t.text }] }));
  if (opening) {
    contents.push({ role: "user", parts: [{ text: `(The customer just picked up. Start the call with this opening, adapted naturally: "${agent.opening.replace("{name}", "")}")` }] });
  }
  const models = cooldown.order(
    [setting("LLM_TEST_MODEL"), ...MODELS].filter((m, i, a): m is string => !!m && a.indexOf(m) === i),
  );
  const begun = Date.now();
  for (const model of models) {
    if (Date.now() - begun > TOTAL_BUDGET_MS) break;
    const started = Date.now();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(agent, business) }] },
        contents,
        generationConfig: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: "low" } },
      }),
      signal: AbortSignal.timeout(PER_MODEL_MS), // a busy model is skipped quickly; the next one answers
    }).catch(() => null);
    console.info(`[voice] ${model}: ${res ? res.status : "timeout"} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    // Busy, slow or out of free quota: rest this model for a while and try the next one.
    if (!res) { cooldown.rest(model, REST_MS.timeout); continue; }
    if (res.status === 429) { cooldown.rest(model, REST_MS.quota); continue; }
    if (res.status >= 500) { cooldown.rest(model, REST_MS.overloaded); continue; }
    if (res.status === 404) { cooldown.rest(model, REST_MS.missing); continue; }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const err = await res.json().catch(() => null);
      const reason = JSON.stringify(err?.error ?? "");
      if (/API_KEY|API key|PERMISSION_DENIED|unregistered callers/i.test(reason)) {
        throw new VoiceError("Gemini rejected the API key. Check GOOGLE_API_KEY.", true);
      }
      continue; // this model can't take the request (e.g. not available on this key): try the next
    }
    if (!res.ok) continue;
    cooldown.clear(model);
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
