"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { CallScreen } from "./CallScreen";
import { Button } from "./ui";

export function TestCallButton({ agentId, name, languageLabel, autoOpen = false }: {
  agentId: string; name: string; languageLabel: string; autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  return (
    <>
      <Button variant="accent" onClick={() => setOpen(true)}><Phone size={15} /> Test call</Button>
      <CallScreen agentId={agentId} name={name} languageLabel={languageLabel} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
