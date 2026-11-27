// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { LANGUAGES, VOICES, voiceById, voicesFor } from "./catalog.ts";
import { generateActivity } from "./activity.ts";
import { DEMO_AGENTS } from "./demo.ts";
import { daily, metrics } from "./metrics.ts";

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

test("generated activity is consistent", () => {
  const now = new Date("2026-11-25T22:30:00+05:30");
  const s = { agents: DEMO_AGENTS, ...generateActivity(DEMO_AGENTS, now.getTime()) };
  assert.ok(s.calls.length > 150, "two weeks of calls");
  assert.ok(s.calls.every((c) => new Date(c.startedAt) <= now), "no call is in the future");
  assert.ok(s.leads.every((l) => new Date(l.createdAt) <= now), "no lead is in the future");
  assert.ok(s.calls.every((c) => s.agents.some((a) => a.id === c.agentId)), "every call has an agent");
  assert.ok(s.calls.every((c) => s.leads.some((l) => l.id === c.leadId)), "every call has its lead");
  assert.ok(s.calls.filter((c) => c.status !== "connected").every((c) => c.durationSec === 0 && c.transcript.length === 0));
  assert.ok(s.calls.filter((c) => c.status === "connected").every((c) => c.durationSec > 0 && c.transcript.length > 2 && c.summary));
  for (const c of s.calls.filter((c) => c.agentId === "ag_meera" && c.summary)) {
    assert.doesNotMatch(c.summary!, /plot|site visit/i, "loan calls have loan summaries");
  }
  const hour = (iso: string) => Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(new Date(iso)));
  assert.ok(s.calls.every((c) => hour(c.startedAt) >= 9 && hour(c.startedAt) < 21), "calls only in calling hours, India time");
  assert.equal(new Set(s.calls.map((c) => c.id)).size, s.calls.length, "call ids are unique");
});

test("activity grows with the clock and never rewrites the past", () => {
  const t1 = new Date("2026-11-25T12:00:00+05:30").getTime();
  const t2 = t1 + 5 * 3600_000;
  const a = generateActivity(DEMO_AGENTS, t1), b = generateActivity(DEMO_AGENTS, t2);
  assert.ok(b.calls.length > a.calls.length, "new calls appear as the day goes on");
  const later = new Map(b.calls.map((c) => [c.id, c]));
  for (const c of a.calls) assert.deepEqual(later.get(c.id), c, `call ${c.id} is unchanged later`);
});

test("metrics and daily series add up", () => {
  const now = new Date("2026-11-25T18:00:00+05:30");
  const s = { agents: DEMO_AGENTS, ...generateActivity(DEMO_AGENTS, now.getTime()) };
  const m = metrics(s.calls, s.agents);
  assert.equal(m.calls, s.calls.length);
  assert.ok(m.connected <= m.calls && m.outcomes <= m.connected);
  assert.ok(m.connectRate >= 0 && m.connectRate <= 1);
  const d = daily(s.calls, s.agents, 14, now);
  assert.equal(d.length, 14);
  assert.equal(d.reduce((a, x) => a + x.calls, 0), s.calls.length, "14-day series covers every call");
  assert.deepEqual(metrics([], s.agents).calls, 0);
  assert.ok(d.every((x) => x.outcomes <= x.connected && x.connected <= x.calls), "wins counted on connected calls only");
});

test("daily buckets calls by India date, not UTC", () => {
  const now = new Date("2026-11-25T18:00:00+05:30");
  const s = { agents: DEMO_AGENTS, ...generateActivity(DEMO_AGENTS, now.getTime()) };
  // 1:30 AM IST on 25 Nov is still 24 Nov in UTC.
  const call = { ...s.calls[0], startedAt: new Date("2026-11-25T01:30:00+05:30").toISOString() };
  const d = daily([call], s.agents, 2, now);
  assert.deepEqual(d.map((x) => [x.date, x.calls]), [["2026-11-24", 0], ["2026-11-25", 1]]);
});
