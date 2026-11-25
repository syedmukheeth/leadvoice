import { cx } from "./ui";

// Deterministic bar heights for a seed, shaped like a voice print (louder in the middle).
function barHeights(seed: number, bars: number): number[] {
  const out: number[] = [];
  let s = seed * 9301 + 49297;
  for (let i = 0; i < bars; i++) {
    s = (s * 9301 + 49297) % 233280;
    const env = Math.sin((i / Math.max(1, bars - 1)) * Math.PI) * 0.65 + 0.35;
    out.push(Math.max(0.12, (s / 233280) * env));
  }
  return out;
}

// Signature element: a voice waveform. Animated when `live`, a static voice print otherwise.
export function Waveform({ seed = 1, bars = 28, live = false, className, color = "bg-ink" }: {
  seed?: number; bars?: number; live?: boolean; className?: string; color?: string;
}) {
  const heights = barHeights(seed, bars);
  return (
    <div className={cx("flex h-8 items-center gap-[3px]", className)} aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className={cx("w-[3px] rounded-full", color, live && "wave-bar")}
          style={{ height: `${Math.round(h * 100)}%`, animationDelay: live ? `${(i * 73) % 900}ms` : undefined }}
        />
      ))}
    </div>
  );
}
