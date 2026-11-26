import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { CallStatus, LeadStatus } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// Page title row. `eyebrow` is a quiet context line (sentence case), not a shouting label.
export function PageHeader({ eyebrow, title, children }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-[13px] text-muted">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[28px]">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-xl border border-line bg-surface elevate", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHead({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 pt-4 pb-3">
      <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      {hint && <span className="text-[12.5px] text-faint">{hint}</span>}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

const btn = {
  primary: "bg-ink text-white hover:bg-ink-2",
  accent: "bg-accent text-white hover:bg-accent-ink",
  ghost: "bg-surface text-ink border border-line hover:border-line-2 hover:bg-paper",
  quiet: "text-muted hover:text-ink hover:bg-paper",
};
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[13.5px] font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export function ButtonLink({ href, variant = "primary", className, children }: { href: string; variant?: keyof typeof btn; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cx(btnBase, btn[variant], className)}>
      {children}
    </Link>
  );
}

export function Button({ variant = "primary", className, ...rest }: ComponentProps<"button"> & { variant?: keyof typeof btn }) {
  return <button className={cx(btnBase, btn[variant], className)} {...rest} />;
}

const pill = "inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap";

const leadTone: Record<LeadStatus, string> = {
  hot: "bg-hot-soft text-hot", warm: "bg-warm-soft text-warm", cold: "bg-cold-soft text-cold",
  new: "bg-accent-soft text-accent-ink", do_not_call: "bg-ink text-white",
};
const leadLabel: Record<LeadStatus, string> = { hot: "Hot", warm: "Warm", cold: "Cold", new: "New", do_not_call: "Do not call" };

export function LeadBadge({ status }: { status?: LeadStatus }) {
  if (!status) return null;
  return <span className={cx(pill, leadTone[status])}>{leadLabel[status]}</span>;
}

const callTone: Record<CallStatus, string> = {
  connected: "bg-live-soft text-live", no_answer: "bg-cold-soft text-cold", voicemail: "bg-cold-soft text-cold",
  failed: "bg-hot-soft text-hot", live: "bg-live text-white",
};
const callLabel: Record<CallStatus, string> = { connected: "Connected", no_answer: "No answer", voicemail: "Voicemail", failed: "Failed", live: "Live" };

export function CallBadge({ status }: { status: CallStatus }) {
  return <span className={cx(pill, callTone[status])}>{callLabel[status]}</span>;
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx(pill, "gap-1 border border-line text-muted", className)}>{children}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-muted">{children}</div>}
    </div>
  );
}
