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

export function daily(calls: Call[], agents: Agent[], days = 14, now = new Date()) {
  const winning = new Set(agents.map((a) => a.outcome));
  const out: { date: string; calls: number; connected: number; outcomes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const day = calls.filter((c) => c.startedAt.slice(0, 10) === key);
    out.push({
      date: key,
      calls: day.length,
      connected: day.filter((c) => c.status === "connected").length,
      outcomes: day.filter((c) => c.outcome && winning.has(c.outcome)).length,
    });
  }
  return out;
}

export function since(calls: Call[], days: number, now = new Date()) {
  const cutoff = now.getTime() - days * 86400000;
  return calls.filter((c) => new Date(c.startedAt).getTime() >= cutoff);
}
