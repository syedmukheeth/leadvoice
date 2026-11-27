"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { resetSampleData } from "@/lib/actions";

export function ResetSample() {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-[13.5px] text-muted">Restore the sample AI agents, leads and calls (removes anything you added).</p>
      <Button variant="ghost" disabled={pending} className="ml-auto"
        onClick={() => { if (confirm("Replace everything with fresh sample data?")) start(() => resetSampleData()); }}>
        {pending ? "Resetting…" : "Reset sample data"}
      </Button>
    </div>
  );
}
