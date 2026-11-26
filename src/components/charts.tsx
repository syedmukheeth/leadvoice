import { pct } from "@/lib/format";

export { TrendChart, TrendLegend } from "./TrendChart";

const RAMP = ["var(--color-viz-1)", "var(--color-viz-2)", "var(--color-viz-3)", "var(--color-viz-4)"];

// Funnel: ordered steps, so an ordinal ramp (light to dark) and no background track.
// Each bar is a real share of the first step; the value sits at the tip, conversion beside it.
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="space-y-3.5">
      {steps.map((s, i) => {
        const share = s.value / top;
        const conv = i > 0 ? s.value / Math.max(1, steps[i - 1].value) : null;
        return (
          <li key={s.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-muted">{s.label}</span>
              <span className="flex items-baseline gap-2">
                {conv !== null && <span className="text-[12px] text-faint">{pct(conv)} of previous</span>}
                <span className="tabular font-semibold text-ink">{s.value}</span>
              </span>
            </div>
            <div
              className="h-2 rounded-r-[4px]"
              style={{ width: `${Math.max(1.5, share * 100)}%`, background: RAMP[Math.min(i, RAMP.length - 1)] }}
              role="img"
              aria-label={`${s.label}: ${s.value}`}
            />
          </li>
        );
      })}
    </ol>
  );
}

// Stat-tile trend: previous period in a quiet grey, current period in the accent, end dot on today.
export function Spark({ values, split, className }: { values: number[]; split?: number; className?: string }) {
  const W = 120, H = 32, pad = 4;
  const max = Math.max(1e-9, ...values);
  const pts = values.map((v, i) => [pad + ((W - pad * 2) * i) / Math.max(1, values.length - 1), H - pad - ((H - pad * 2) * v) / max] as const);
  const cut = split ?? Math.floor(values.length / 2);
  const toPath = (p: readonly (readonly [number, number])[]) => p.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden>
      <path d={toPath(pts.slice(0, cut + 1))} fill="none" stroke="var(--color-line-2)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <path d={toPath(pts.slice(cut))} fill="none" stroke="var(--color-accent)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      {last && <circle cx={last[0]} cy={last[1]} r="3" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" />}
    </svg>
  );
}
