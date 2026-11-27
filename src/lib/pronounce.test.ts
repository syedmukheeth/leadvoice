// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { forSpeech } from "./pronounce.ts";

const sayAs = {
  "ASRG Constructions": { te: "ఏ ఎస్ ఆర్ జీ కన్‌స్ట్రక్షన్స్", hi: "ए एस आर जी कंस्ट्रक्शन्स", en: "A S R G Constructions" },
  ASRG: { te: "ఏ ఎస్ ఆర్ జీ", hi: "ए एस आर जी", en: "A S R G" },
};

test("forSpeech spells out the business name for the voice", () => {
  assert.equal(forSpeech("నేను ASRG Constructions నుంచి కావ్య.", "te", sayAs), "నేను ఏ ఎస్ ఆర్ జీ కన్‌స్ట్రక్షన్స్ నుంచి కావ్య.");
  assert.equal(forSpeech("Welcome to ASRG Constructions!", "en", sayAs), "Welcome to A S R G Constructions!");
  assert.equal(forSpeech("मैं asrg constructions से।", "hi", sayAs), "मैं ए एस आर जी कंस्ट्रक्शन्स से।");
});

test("forSpeech handles the short name and leaves other words alone", () => {
  assert.equal(forSpeech("ASRG లేఅవుట్ Kurnool లో ఉంది", "te", sayAs), "ఏ ఎస్ ఆర్ జీ లేఅవుట్ Kurnool లో ఉంది");
  assert.equal(forSpeech("ASRGX is different", "en", sayAs), "ASRGX is different");
});
