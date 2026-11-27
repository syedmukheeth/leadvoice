// Cues the live call screen sends the agent as text; the agent's instructions (live.ts) say what
// each one means. Kept apart so the browser bundle doesn't pull in the prompt code.
export const CUE = {
  connected: "(call connected)",
  silent: "(the customer has gone quiet)",
  reconnected: "(the line dropped for a moment and is back)",
} as const;
