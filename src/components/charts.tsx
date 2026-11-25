import { pct, shortDay } from "@/lib/format";

export function TrendChart({ data }: { data: { date: string; calls: number; connected: number; outcomes: number }[] }) {
  const W = 640, H = 220, pl = 30, pr = 8, pt = 12, pb = 28;
  const max = Math.max(4, ...data.map((d) => d.calls));
  const cw = (W - pl - pr) / data.length;
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / max);
  const line = data.map((d, i) => `${i ? "L" : "M"}${pl + cw * i + cw / 2},${y(d.outcomes)}`).join(" ");
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Calls, connected calls and outcomes per day">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} stroke="#e2e6e1" strokeDasharray={t ? "3 4" : undefined} />
          <text x={pl - 8} y={y(t) + 4} fontSize="10" fill="#6e7a85" textAnchor="end">{t}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = pl + cw * i + cw * 0.18, w = cw * 0.64;
        return (
          <g key={d.date}>
            <rect x={x} y={y(d.calls)} width={w} height={H - pb - y(d.calls)} rx="4" fill="#dfe5de">
              <title>{`${shortDay(d.date)}: ${d.calls} calls`}</title>
            </rect>
            <rect x={x} y={y(d.connected)} width={w} height={H - pb - y(d.connected)} rx="4" fill="#1b2c3b">
              <title>{`${d.connected} connected`}</title>
            </rect>
            {i % 2 === 0 && <text x={x + w / 2} y={H - 9} fontSize="10" fill="#6e7a85" textAnchor="middle">{shortDay(d.date)}</text>}
          </g>
        );
      })}
      <path d={line} fill="none" stroke="#e89a2c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={d.date} cx={pl + cw * i + cw / 2} cy={y(d.outcomes)} r="3.5" fill="#fff" stroke="#e89a2c" strokeWidth="2">
          <title>{`${d.outcomes} outcomes`}</title>
        </circle>
      ))}
    </svg>
  );
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => (
        <div key={s.label} className="grid grid-cols-[120px_1fr_70px] items-center gap-3 text-[13px]">
          <span className="text-muted">{s.label}</span>
          <div className="h-7 rounded-lg bg-paper overflow-hidden">
            <div
              className={i === steps.length - 1 ? "h-full rounded-lg bg-signal" : "h-full rounded-lg bg-ink-2"}
              style={{ width: `${Math.max(2, (100 * s.value) / top)}%`, opacity: 1 - i * 0.14 }}
            />
          </div>
          <span className="text-right tabular">
            <b className="font-semibold">{s.value}</b>
            {i > 0 && <span className="ml-1 text-faint text-[11px]">{pct(s.value / Math.max(1, steps[i - 1].value))}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Spark({ values, className }: { values: number[]; className?: string }) {
  const W = 120, H = 34, max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(W * i) / Math.max(1, values.length - 1)},${H - 3 - ((H - 6) * v) / max}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
