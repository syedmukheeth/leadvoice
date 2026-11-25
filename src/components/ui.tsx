import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { CallStatus, LeadStatus } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-signal mb-1.5">{eyebrow}</p>}
        <h1 className="font-display text-[40px] leading-[1.05] text-ink">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-2xl border border-line bg-surface shadow-[0_1px_0_rgba(15,27,38,.03)]", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHead({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-3">
      <h2 className="text-[13.5px] font-semibold text-ink">{title}</h2>
      {hint && <span className="text-xs text-faint">{hint}</span>}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

const btn = {
  primary: "bg-ink text-white hover:bg-ink-2",
  signal: "bg-signal text-ink hover:brightness-105",
  ghost: "bg-surface text-ink border border-line hover:border-line-2",
  quiet: "text-muted hover:text-ink hover:bg-paper",
};

export function ButtonLink({ href, variant = "primary", className, children }: { href: string; variant?: keyof typeof btn; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cx("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition", btn[variant], className)}>
      {children}
    </Link>
  );
}

export function Button({ variant = "primary", className, ...rest }: ComponentProps<"button"> & { variant?: keyof typeof btn }) {
  return (
    <button className={cx("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition disabled:opacity-50", btn[variant], className)} {...rest} />
  );
}

const leadTone: Record<LeadStatus, string> = {
  hot: "bg-hot-soft text-hot", warm: "bg-warm-soft text-warm", cold: "bg-cold-soft text-cold",
  new: "bg-signal-soft text-ink", do_not_call: "bg-ink text-white",
};
const leadLabel: Record<LeadStatus, string> = { hot: "Hot", warm: "Warm", cold: "Cold", new: "New", do_not_call: "Do not call" };

export function LeadBadge({ status }: { status?: LeadStatus }) {
  if (!status) return null;
  return <span className={cx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", leadTone[status])}>{leadLabel[status]}</span>;
}

const callTone: Record<CallStatus, string> = {
  connected: "bg-live-soft text-live", no_answer: "bg-cold-soft text-cold", voicemail: "bg-violet-soft text-violet",
  failed: "bg-hot-soft text-hot", live: "bg-live text-white",
};
const callLabel: Record<CallStatus, string> = { connected: "Connected", no_answer: "No answer", voicemail: "Voicemail", failed: "Failed", live: "Live" };

export function CallBadge({ status }: { status: CallStatus }) {
  return <span className={cx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", callTone[status])}>{callLabel[status]}</span>;
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted", className)}>{children}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-display text-2xl text-ink">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}
