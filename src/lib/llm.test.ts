// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { hasForeignScript, parseReply, quotaRestMs, requestBody, saysGoodbye } from "./llm.ts";

const contents = [{ role: "user", parts: [{ text: "hello" }] }];

test("each model family gets the request shape it accepts", () => {
  const gemma = requestBody("gemma-4-31b-it", "SYS", contents) as { contents: { parts: { text: string }[] }[]; systemInstruction?: unknown };
  assert.equal(gemma.systemInstruction, undefined);
  assert.match(gemma.contents[0].parts[0].text, /^SYS/);
  const g25 = requestBody("gemini-2.5-flash", "SYS", contents) as { generationConfig: { thinkingConfig: object } };
  assert.deepEqual(g25.generationConfig.thinkingConfig, { thinkingBudget: 0 });
  const g35 = requestBody("gemini-3.5-flash-lite", "SYS", contents) as { generationConfig: { thinkingConfig: object } };
  assert.deepEqual(g35.generationConfig.thinkingConfig, { thinkingLevel: "low" });
});

test("parseReply reads JSON, fenced JSON and plain speech, never a broken blob", () => {
  assert.deepEqual(parseReply('{"reply":"సరే అండి","action":"","end":false}'), { reply: "సరే అండి", action: undefined, end: false });
  assert.deepEqual(parseReply('```json\n{"reply":"Sure","action":"Site visit booked","end":true}\n```'), { reply: "Sure", action: "Site visit booked", end: true });
  assert.deepEqual(parseReply("జీ, చెప్పండి"), { reply: "జీ, చెప్పండి", end: false });
  assert.equal(parseReply('{"reply": "half'), null);
  assert.equal(parseReply(""), null);
});

test("daily quota rests until the Pacific midnight reset, per-minute for the suggested delay", () => {
  const now = new Date("2026-11-27T08:00:00Z"); // 00:00 Pacific
  const day = quotaRestMs({ details: [{ violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }] }] }, now);
  assert.ok(day > 23 * 3600_000 && day <= 24 * 3600_000 + 60_000, `rests about a day (${day})`);
  assert.equal(quotaRestMs({ details: [{ retryDelay: "37s" }] }, now), 38_000);
  assert.equal(quotaRestMs({}, now), 60_000);
});

test("hasForeignScript catches other Indian scripts but allows Telugu, Hindi and English", () => {
  assert.equal(hasForeignScript("ప్లాట్ సుమారు പതിനെട്ട lakhs"), true);
  assert.equal(hasForeignScript("ಹದಿನೆಂಟು ಲಕ್ಷ"), true);
  assert.equal(hasForeignScript("పదునెనిమిది లక్షలు, Kurnool"), false);
  assert.equal(hasForeignScript("अठारह लाख, site visit"), false);
  assert.equal(hasForeignScript("Eighteen lakh rupees"), false);
});

test("saysGoodbye recognises goodbyes in all three languages", () => {
  assert.equal(saysGoodbye("సరే అండి, ధన్యవాదాలు. మంచి రోజు అండి!"), true);
  assert.equal(saysGoodbye("जी, धन्यवाद। आपका दिन अच्छा रहे!"), true);
  assert.equal(saysGoodbye("Thank you, have a great day!"), true);
  assert.equal(saysGoodbye("ఈ ఆదివారం పదకొండు గంటలకు site visit కన్ఫర్మ్ చేశాను. location WhatsApp కి వస్తుంది."), false);
});
