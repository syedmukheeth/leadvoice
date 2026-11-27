// Live voice calls: one continuous Gemini Live audio stream instead of record, transcribe, think and
// speak in turns. The customer can talk over the agent, and replies start within about a second.
// The server builds the whole session (voice, instructions, tools) and locks it inside a one-time
// token, so the browser never sees the API key or the agent's instructions.
import { LANGUAGES, voiceById } from "./catalog.ts";
import { CLIENT } from "./client.ts";
import { CUE } from "./live-cues.ts";
import { openingLine } from "./opening.ts";
import { forSpeech } from "./pronounce.ts";
import { AWARENESS, STYLE, humanRules, nowInIndia } from "./persona.ts";
import type { Agent } from "./types.ts";

export { CUE };
export const LIVE_MODEL = "gemini-3.8-live";


// Gemini voices that suit each agent: warm for Telugu, gentle for Hindi, friendly for English.
const LIVE_VOICE = {
  female: { te: "Sulafat", hi: "Vindemiatrix", en: "Sulafat" },
  male: { te: "Achird", hi: "Algieba", en: "Achird" },
} as const;

const TOOLS = [
  {
    name: "save_outcome",
    description: "Record a result of this call once its details are agreed: the goal (for example a site visit with its day and time) or a callback time. Once per result.",
    parameters: {
      type: "OBJECT",
      properties: { label: { type: "STRING", description: 'Short English label, for example "Site visit booked · Sun 11 AM" or "Callback booked · Thu 6 PM"' } },
      required: ["label"],
    },
  },
  {
    name: "end_call",
    description: "Hang up the phone. Only right after you have said goodbye.",
    parameters: { type: "OBJECT", properties: {} },
  },
];

export function liveVoice(agent: Agent): string {
  return LIVE_VOICE[voiceById(agent.voiceId, agent.language).gender][agent.language];
}

export function liveInstructions(agent: Agent, business: string, now = new Date()): string {
  const lang = LANGUAGES.find((l) => l.id === agent.language)!;
  const voice = voiceById(agent.voiceId, agent.language);
  const text = `${business}\n${agent.opening}\n${agent.knowledge}\n${agent.script}`;
  // Longest names first, so "ASRG Constructions" wins over "ASRG".
  const sayAs = Object.entries(CLIENT.sayAs)
    .sort(([a], [b]) => b.length - a.length)
    .filter(([name]) => text.includes(name))
    .map(([name, by]) => `"${name}" as "${by[agent.language]}"`);
  return `You are ${agent.name}, a ${voice.gender} telecaller for ${business} in ${CLIENT.city}, talking to a customer on a live phone call. Your job: ${agent.role}
It is now ${nowInIndia(now)} in India; use this for "today", "tomorrow" and "this Sunday".

HOW YOU SOUND
${STYLE[agent.language]}
${agent.language === "en" ? "Speak Indian English the whole time." : `Speak ${lang.label} the whole time; common English words are fine.`} Switch language only if the customer speaks a whole sentence in another language or asks you to; short words like "ha", "ok" or "yes" are not a switch.
Use ${voice.gender} grammatical forms for yourself.${sayAs.length ? `\nAlways pronounce ${sayAs.join(" and ")}, letter by letter.` : ""}
Keep every turn short: one or two sentences, one question at a time. Say numbers, prices, dates and times the way people say them aloud.

${humanRules(agent.language)}

${AWARENESS}

How the call should go:
${agent.script}

KNOWLEDGE (the only facts you may share):
${agent.knowledge}

ACTIONS (silent: never mention them or read them out)
- When ${agent.outcome.toLowerCase()} or a callback is agreed with its day and time, call save_outcome once with a short English label, like "${agent.outcome} · Sun 11 AM" or "Callback booked · Thu 6 PM". Then carry on talking.
- Saying goodbye: first confirm the details and ask if there's anything else, then wait for their answer. Say goodbye only after they answer or say goodbye themselves, never in the same turn as the confirmation.
- Right after your goodbye, call end_call and say nothing more. Never call end_call in a turn that asks a question.

CUES (they are not the customer's words; never read them aloud)
- "${CUE.connected}": the customer just picked up. Greet them with your opening, in your own natural words: "${forSpeech(openingLine(agent.opening), agent.language)}"
- "${CUE.silent}": the customer has said nothing for a while. Check gently that they can hear you. If it happens again, say you'll call back later, say goodbye and end the call.
- "${CUE.reconnected}": say sorry for the line in a few words and carry on from where you were.

A successful call ends with: ${agent.outcome}.
STRICT: never invent products, prices, places, offers or features. If KNOWLEDGE doesn't say it, say the team will confirm it.`;
}

// The full session setup, locked into the call's token.
export function liveSetup(agent: Agent, business: string, model = LIVE_MODEL, now = new Date()) {
  return {
    model: `models/${model}`,
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: liveVoice(agent) } } },
    },
    systemInstruction: { parts: [{ text: liveInstructions(agent, business, now) }] },
    tools: [{ functionDeclarations: TOOLS }],
    // Gentle end-of-speech detection with a short pause: replies start in about a second, and a
    // customer who pauses at a comma isn't cut off.
    realtimeInputConfig: { automaticActivityDetection: { endOfSpeechSensitivity: "END_SENSITIVITY_LOW", silenceDurationMs: 400 } },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  };
}

// The ephemeral-token request body: one use, a short window to connect, a 30-minute call.
export function tokenRequest(setup: ReturnType<typeof liveSetup>, now = Date.now()) {
  return {
    uses: 1,
    expireTime: new Date(now + 30 * 60_000).toISOString(),
    newSessionExpireTime: new Date(now + 2 * 60_000).toISOString(),
    bidiGenerateContentSetup: setup,
  };
}
