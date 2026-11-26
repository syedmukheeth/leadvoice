// Remembers which Gemini models are out of free quota or overloaded, so replies skip them for a
// while instead of waiting on them every turn (an overloaded model costs an 8 s timeout).

export const REST_MS = {
  quota: 10 * 60_000, // 429: free per-minute or per-day quota used up
  timeout: 2 * 60_000, // too slow to answer in time
  overloaded: 60_000, // 5xx: busy right now
  missing: 60 * 60_000, // 404: model not available on this key
};

export function createCooldown(now: () => number = Date.now) {
  const until = new Map<string, number>();
  return {
    /** Models not resting, in the given order. If every model is resting, all of them. */
    order(models: string[]): string[] {
      const t = now();
      const ready = models.filter((m) => (until.get(m) ?? 0) <= t);
      return ready.length ? ready : models;
    },
    rest(model: string, ms: number) {
      until.set(model, now() + ms);
    },
    clear(model: string) {
      until.delete(model);
    },
  };
}
