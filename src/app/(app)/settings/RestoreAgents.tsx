"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { restoreDefaultAgents } from "@/lib/actions";

export function RestoreAgents() {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-[13.5px] text-muted">Put the AI agents&apos; scripts, voices and knowledge back to how they were set up. Leads and calls stay.</p>
      <Button variant="ghost" disabled={pending} className="ml-auto"
        onClick={() => { if (confirm("Undo every change to the AI agents' scripts, voices and knowledge?")) start(() => restoreDefaultAgents()); }}>
        {pending ? "Restoring…" : "Restore agents"}
      </Button>
    </div>
  );
}
