// Rewrites a reply just before it is spoken so names come out right (see CLIENT.sayAs).
import { CLIENT } from "./client.ts";
import type { Language } from "./types";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function forSpeech(text: string, lang: Language, sayAs = CLIENT.sayAs): string {
  // Longest names first, so "ASRG Constructions" wins over "ASRG".
  const names = Object.keys(sayAs).sort((a, b) => b.length - a.length);
  let out = text;
  for (const name of names) {
    out = out.replace(new RegExp(`(?<![A-Za-z])${escape(name)}(?![A-Za-z])`, "gi"), sayAs[name][lang]);
  }
  return out;
}
