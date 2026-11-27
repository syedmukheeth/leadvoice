// Free Gemini-API models, how to call each family, and how to read their replies and quota errors.
// Every model has its own free quota, so a wide pool gives many more free replies per day.

// Fast first, then the bigger Flash models, then Gemma as an extra free reserve.
export const MODELS = [
  "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash", "gemini-3-flash-preview", "gemini-3.5-flash",
  "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.8-flash",
  "gemma-4-26b-a4b-it", "gemma-4-31b-it",
];

type Part = { text: string };
type Content = { role: string; parts: Part[] };

export function requestBody(model: string, system: string, contents: Content[]) {
  if (model.startsWith("gemma")) {
    // Gemma has no system-instruction slot or JSON mode: instructions go in the first user turn.
    return { contents: [{ role: "user", parts: [{ text: `${system}\n\n(The call has started.)` }] }, ...contents] };
  }
  // Gemini 2.5 takes a thinking budget; newer models take a thinking level.
  const thinkingConfig = /^gemini-2\./.test(model) ? { thinkingBudget: 0 } : { thinkingLevel: "low" };
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { responseMimeType: "application/json", thinkingConfig },
  };
}

export interface Parsed { reply: string; action?: string; end: boolean }

// Reads {"reply", "action", "end"} even when it's wrapped in a code fence or extra words.
export function parseReply(text: string): Parsed | null {
  const t = text.trim();
  if (!t) return null;
  const json = t.match(/\{[\s\S]*\}/)?.[0];
  if (json) {
    try {
      const j = JSON.parse(json);
      const reply = String(j.reply ?? "").trim();
      if (reply) return { reply, action: String(j.action ?? "").trim() || undefined, end: Boolean(j.end) };
    } catch { /* not JSON after all */ }
  }
  // Plain speech is fine; a broken JSON blob must never be read out loud.
  return /[{}"]/.test(t) ? null : { reply: t, end: false };
}

// How long to rest a model after a 429. Daily limits rest until Google's midnight (Pacific time) reset,
// per-minute limits for the retry delay Google suggests.
export function quotaRestMs(error: unknown, now = new Date()): number {
  const raw = JSON.stringify(error ?? "");
  if (/PerDay/i.test(raw)) {
    const la = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const next = new Date(la);
    next.setHours(24, 0, 0, 0);
    return next.getTime() - la.getTime() + 60_000;
  }
  const delay = raw.match(/"retryDelay":"(\d+(?:\.\d+)?)s"/);
  return delay ? Math.ceil(Number(delay[1]) * 1000) + 1000 : 60_000;
}

// True if the text uses an Indian script the voices can't speak (Malayalam, Tamil, Kannada, Bengali,
// Gujarati, Gurmukhi or Odia). Small models sometimes slip one word in, like "eighteen" written in Malayalam ("പതിനെട്ട").
// Telugu, Devanagari and Latin are fine: callers may switch between Telugu, Hindi and English.
export function hasForeignScript(text: string): boolean {
  return /[ঀ-௿ಀ-෿]/.test(text);
}

// A call may only end on a reply that actually says goodbye. Models sometimes mark "end" on the
// booking confirmation itself, which would hang up on the customer mid-thought.
export function saysGoodbye(text: string): boolean {
  return /ధన్యవాద|ధన్యవాదాలు|బై|धन्यवाद|शुक्रिया|thank|bye|good day|great day|take care/i.test(text);
}
