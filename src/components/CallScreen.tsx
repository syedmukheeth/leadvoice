"use client";

import { useState } from "react";
import { LiveCall } from "./LiveCall";
import { TestCall } from "./TestCall";

// Opens a call with an AI agent: a live, continuous call first. If live calls aren't available
// (free quota used up, outage), it switches to step-by-step calls on its own, so a demo never stops.
export function CallScreen({ agentId, name, languageLabel, open, onClose }: {
  agentId: string; name: string; languageLabel: string; open: boolean; onClose: () => void;
}) {
  const [mode, setMode] = useState<"live" | "steps">("live");
  if (!open) return null;
  const close = () => { setMode("live"); onClose(); };
  return mode === "live"
    ? <LiveCall agentId={agentId} name={name} languageLabel={languageLabel} onClose={close} onFallback={() => setMode("steps")} />
    : <TestCall agentId={agentId} name={name} languageLabel={languageLabel} open autoStart onClose={close} />;
}
