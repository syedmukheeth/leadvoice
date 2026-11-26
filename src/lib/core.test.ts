// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { LANGUAGES, VOICES, guessTemplate, voiceById, voicesFor } from "./catalog.ts";
import { buildDemoStore } from "./demo.ts";
import { daily, metrics } from "./metrics.ts";

test("guessTemplate picks the industry from one sentence", () => {
  assert.equal(guessTemplate("Call plot buyers and book a site visit").key, "real_estate");
  assert.equal(guessTemplate("Remind loan applicants about EMI and documents").key, "loans");
  assert.equal(guessTemplate("Confirm every cash on delivery order and address").key, "cod");
  assert.equal(guessTemplate("Book patient appointments with the doctor").key, "hospital");
  assert.equal(guessTemplate("Screen candidates for notice period and salary").key, "recruitment");
});

test("every language has natural voices of both genders", () => {
  for (const l of LANGUAGES) {
    const vs = voicesFor(l.id);
    assert.ok(vs.length >= 3, `${l.label} has voices`);
    assert.ok(vs.some((v) => v.gender === "female") && vs.some((v) => v.gender === "male"), `${l.label} has both genders`);
  }
  assert.equal(new Set(VOICES.map((v) => v.id)).size, VOICES.length, "voice ids are unique");
});

test("unknown (old) voice ids fall back to a voice in the agent's language", () => {
  assert.equal(voiceById("kavya", "te").language, "te");
  assert.equal(voiceById("shruti", "hi").language, "hi");
  assert.equal(voiceById("ritu_hi_conversation").id, "ritu_hi_conversation");
});

test("sample data is consistent", () => {
  const now = new Date("2026-11-25T22:30:00+05:30"); // late evening: the old bug put calls in the future
  const s = buildDemoStore(now);
  assert.ok(s.calls.every((c) => new Date(c.startedAt) <= now), "no call is in the future");
  assert.ok(s.calls.every((c) => s.agents.some((a) => a.id === c.agentId)), "every call has an agent");
  assert.ok(s.calls.filter((c) => c.status !== "connected").every((c) => c.durationSec === 0 && c.transcript.length === 0));
  for (const c of s.calls.filter((c) => c.agentId === "ag_meera" && c.summary)) {
    assert.doesNotMatch(c.summary!, /plot|site visit/i, "loan calls have loan summaries");
  }
});

test("metrics and daily series add up", () => {
  const now = new Date("2026-11-25T18:00:00+05:30");
  const s = buildDemoStore(now);
  const m = metrics(s.calls, s.agents);
  assert.equal(m.calls, s.calls.length);
  assert.ok(m.connected <= m.calls && m.outcomes <= m.connected);
  assert.ok(m.connectRate >= 0 && m.connectRate <= 1);
  const d = daily(s.calls, s.agents, 14, now);
  assert.equal(d.length, 14);
  assert.equal(d.reduce((a, x) => a + x.calls, 0), s.calls.length, "14-day series covers every sample call");
  assert.deepEqual(metrics([], s.agents).calls, 0);
  assert.ok(d.every((x) => x.outcomes <= x.connected && x.connected <= x.calls), "wins counted on connected calls only");
});

test("daily buckets calls by India date, not UTC", () => {
  const now = new Date("2026-11-25T18:00:00+05:30");
  const s = buildDemoStore(now);
  // 1:30 AM IST on 25 Nov is still 24 Nov in UTC.
  const call = { ...s.calls[0], startedAt: new Date("2026-11-25T01:30:00+05:30").toISOString() };
  const d = daily([call], s.agents, 2, now);
  assert.deepEqual(d.map((x) => [x.date, x.calls]), [["2026-11-24", 0], ["2026-11-25", 1]]);
});
