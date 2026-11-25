"use client";

import { useRef, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { cx } from "./ui";

// Plays a 10-second sample of a voice in the chosen language.
export function VoicePlay({ voice, lang, className }: { voice: string; lang: string; className?: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state === "playing") { audio.current?.pause(); setState("idle"); return; }
    setState("loading");
    const a = new Audio(`/api/voices/preview?voice=${voice}&lang=${lang}`);
    audio.current = a;
    a.onended = () => setState("idle");
    a.onerror = () => setState("error");
    try { await a.play(); setState("playing"); } catch { setState("error"); }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={state === "error" ? "Sample unavailable — add your Sarvam key" : "Play a sample"}
      className={cx(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full transition",
        state === "error" ? "bg-hot-soft text-hot" : "bg-ink text-white hover:bg-ink-2",
        className,
      )}
    >
      {state === "loading" ? <Loader2 size={15} className="animate-spin" /> : state === "playing" ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
    </button>
  );
}
