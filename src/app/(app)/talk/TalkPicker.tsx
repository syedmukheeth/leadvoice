"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { TestCall } from "@/components/TestCall";
import { Waveform } from "@/components/Waveform";
import { cx } from "@/components/ui";

export interface TalkAgent { id: string; name: string; role: string; outcome: string; languageLabel: string; native: string; voice: string; live: boolean }

// Client-demo screen: pick an AI employee and talk to it in the browser, like a real phone call.
export function TalkPicker({ agents }: { agents: TalkAgent[] }) {
  const [open, setOpen] = useState<TalkAgent | null>(null);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setOpen(a)}
            className="group flex flex-col rounded-xl border border-line bg-surface p-5 text-left elevate transition-[border-color,box-shadow] hover:border-accent hover:shadow-[0_0_0_3px_var(--color-accent-soft)]"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-cold-soft text-[17px] font-semibold text-ink">{a.name[0]}</span>
              <div className="min-w-0">
                <p className="text-[16px] font-semibold tracking-[-0.015em] text-ink">{a.name}</p>
                <p className="text-[12.5px] text-faint">{a.native}, {a.voice} voice</p>
              </div>
              {!a.live && <span className="ml-auto rounded-full bg-cold-soft px-2 py-0.5 text-[11.5px] font-medium text-cold">Paused</span>}
            </div>
            <Waveform seed={i + 11} bars={36} className="mt-4 h-7" color="bg-viz-2" />
            <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{a.role}</p>
            <p className="mt-1 text-[12.5px] text-faint">Goal: {a.outcome.toLowerCase()}</p>
            <span className={cx("mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-ink px-3.5 py-2 text-[13.5px] font-medium text-white transition-colors group-hover:bg-accent")}>
              <Phone size={15} strokeWidth={2} /> Call {a.name}
            </span>
          </button>
        ))}
      </div>
      {open && (
        <TestCall agentId={open.id} name={open.name} languageLabel={open.languageLabel} open onClose={() => setOpen(null)} />
      )}
    </>
  );
}
