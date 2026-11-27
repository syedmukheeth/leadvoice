// Everything specific to the business this portal is built for. A new client = a new copy of this
// file (plus their agents' script and knowledge), deployed on its own.
import type { Language } from "./types";

export const CLIENT = {
  name: "ASRG Constructions",
  city: "Kurnool",
  portal: "AI calling desk",
  // How the voice should say names. The screen keeps the normal spelling; only the speech changes.
  // Spelled-out letters make the voice read "ASRG" as A-S-R-G instead of guessing a word.
  sayAs: {
    "ASRG Constructions": { te: "ఏ ఎస్ ఆర్ జీ కన్‌స్ట్రక్షన్స్", hi: "ए एस आर जी कंस्ट्रक्शन्स", en: "A S R G Constructions" },
    ASRG: { te: "ఏ ఎస్ ఆర్ జీ", hi: "ए एस आर जी", en: "A S R G" },
  } as Record<string, Record<Language, string>>,
};
