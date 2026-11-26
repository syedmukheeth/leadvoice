import type { Agent, Call } from "./types";

export interface Metrics {
  calls: number;
  connected: number;
  connectRate: number;
  outcomes: number;
  outcomeRate: number;
  callbacks: number;
  minutes: number;
  spend: number;
  costPerOutcome: number;
  avgDurationSec: number;
}

export function metrics(calls: Call[], agents: Agent[]): Metrics {
  const winning = new Set(agents.map((a) => a.outcome));
  const connected = calls.filter((c) => c.status === "connected");
  const outcomes = connected.filter((c) => c.outcome && winning.has(c.outcome)).length;
  const secs = connected.reduce((a, c) => a + c.durationSec, 0);
  const spend = calls.reduce((a, c) => a + c.costInr, 0);
  return {
    calls: calls.length,
    connected: connected.length,
    connectRate: calls.length ? connected.length / calls.length : 0,
    outcomes,
    outcomeRate: connected.length ? outcomes / connected.length : 0,
    callbacks: connected.filter((c) => c.outcome === "Callback").length,
    minutes: secs / 60,
    spend,
    costPerOutcome: outcomes ? spend / outcomes : 0,
    avgDurationSec: connected.length ? secs / connected.length : 0,
  };
}

export interface Day { date: string; calls: number; connected: number; outcomes: number; spend: number }

// Calendar day in India time (YYYY-MM-DD), so a 2 AM call counts on the day it happened.
const istDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
export const dayKey = (d: Date | string) => istDay.format(typeof d === "string" ? new Date(d) : d);

export function daily(calls: Call[], agents: Agent[], days = 14, now = new Date()): Day[] {
  const byDay = new Map<string, Call[]>();
  for (const c of calls) {
    const k = dayKey(c.startedAt);
    byDay.set(k, [...(byDay.get(k) ?? []), c]);
  }
  const out: Day[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = dayKey(new Date(now.getTime() - i * 86400000));
    const m = metrics(byDay.get(date) ?? [], agents);
    out.push({ date, calls: m.calls, connected: m.connected, outcomes: m.outcomes, spend: m.spend });
  }
  return out;
}

export function since(calls: Call[], days: number, now = new Date()) {
  const cutoff = now.getTime() - days * 86400000;
  return calls.filter((c) => new Date(c.startedAt).getTime() >= cutoff);
}
