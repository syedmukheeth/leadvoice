"use client";

import { useState } from "react";
import { shortDay } from "@/lib/format";

type Day = { date: string; calls: number; connected: number; outcomes: number; spend: number };

// Stacked by outcome, bottom to top: won, connected (no win), not connected. The stack height is
// the day's calls, so one axis carries everything. Colours are one validated hue, light to dark.
export const SERIES = [
  { key: "won", label: "Won", color: "var(--color-viz-4)" },
  { key: "connected", label: "Connected", color: "var(--color-viz-2)" },
  { key: "missed", label: "No answer", color: "var(--color-viz-1)" },
] as const;

const W = 640, H = 232, PL = 32, PR = 4, PT = 10, PB = 26, GAP = 2, R = 4;

function niceMax(v: number) {
  const step = v <= 8 ? 2 : v <= 20 ? 5 : v <= 50 ? 10 : 20;
  return Math.max(step * 2, Math.ceil(v / step) * step);
}

// Rect with only the top corners rounded (data end), square at the baseline.
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export function TrendChart({ data }: { data: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.map((d) => d.calls)));
  const ticks = [0, max / 2, max];
  const band = (W - PL - PR) / data.length;
  const bw = Math.min(24, band * 0.62);
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / max);
  const hDay = active !== null ? data[active] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img"
        aria-label="Calls per day for the last 14 days, split into won, connected and not answered">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={PL - 8} y={y(t) + 3.5} fontSize="10.5" fill="var(--color-faint)" textAnchor="end" className="tabular">{t}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PL + band * i + band / 2;
          const x = cx - bw / 2;
          const parts = [d.outcomes, d.connected - d.outcomes, d.calls - d.connected];
          let base = H - PB;
          const top = parts.reduce((acc, v, k) => (v > 0 ? k : acc), -1);
          return (
            <g key={d.date}
              tabIndex={0}
              role="button"
              aria-label={`${shortDay(d.date)}: ${d.calls} calls, ${d.connected} connected, ${d.outcomes} won`}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              className="outline-none">
              {/* hover band, wider than the bar so the target is easy to hit */}
              <rect x={PL + band * i} y={PT} width={band} height={H - PT - PB} rx="6"
                fill={active === i ? "var(--color-cold-soft)" : "transparent"} />
              {parts.map((v, k) => {
                if (v <= 0) return null;
                const h = (H - PT - PB) * (v / max);
                const segTop = base - h;
                const drawH = Math.max(1, h - (k === top ? 0 : GAP));
                const el = k === top
                  ? <path key={k} d={topRounded(x, segTop, bw, drawH, R)} fill={SERIES[k].color} />
                  : <rect key={k} x={x} y={segTop + GAP} width={bw} height={drawH} fill={SERIES[k].color} />;
                base = segTop;
                return el;
              })}
              {(i % 2 === 1 || data.length <= 7) && (
                <text x={cx} y={H - 8} fontSize="10.5" fill="var(--color-faint)" textAnchor="middle">{shortDay(d.date)}</text>
              )}
            </g>
          );
        })}
      </svg>

      {hDay && active !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 w-44 rounded-lg border border-line bg-surface p-3 text-[12px] shadow-[0_8px_24px_rgb(17_17_20/.08)]"
          style={{
            left: `${((PL + band * active + band / 2) / W) * 100}%`,
            transform: active > data.length / 2 ? "translateX(calc(-100% - 14px))" : "translateX(14px)",
          }}
        >
          <p className="mb-2 font-semibold text-ink">{shortDay(hDay.date)}</p>
          {[
            ["Calls", hDay.calls],
            ["Connected", hDay.connected],
            ["Won", hDay.outcomes],
          ].map(([k, v], j) => (
            <p key={k} className="flex items-center justify-between py-0.5 text-muted">
              <span className="flex items-center gap-1.5">
                {j > 0 && <i className="h-2 w-2 rounded-sm" style={{ background: SERIES[j === 2 ? 0 : 1].color }} />}
                {k}
              </span>
              <span className="tabular font-medium text-ink">{v}</span>
            </p>
          ))}
        </div>
      )}

      <table className="sr-only">
        <caption>Calls per day</caption>
        <thead><tr><th>Day</th><th>Calls</th><th>Connected</th><th>Won</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}><td>{shortDay(d.date)}</td><td>{d.calls}</td><td>{d.connected}</td><td>{d.outcomes}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TrendLegend() {
  return (
    <span className="flex items-center gap-3.5 text-[12px] text-muted">
      {SERIES.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </span>
  );
}
