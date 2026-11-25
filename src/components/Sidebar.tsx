"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, Bot, Code2, LayoutGrid, PhoneCall, Settings, Users, Wallet } from "lucide-react";
import { cx } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/agents", label: "AI employees", icon: Bot },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/voices", label: "Voices", icon: AudioLines },
  { href: "/developers", label: "Developers", icon: Code2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ workspace, credits, onDuty }: { workspace: string; credits: number; onDuty: number }) {
  const path = usePathname();
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[252px] flex-col bg-ink text-white">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-6 pt-6 pb-7">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-signal text-ink">
          <AudioLines size={18} strokeWidth={2.4} />
        </span>
        <span className="text-[19px] font-semibold tracking-tight">Lead<span className="font-display italic text-signal text-[22px]">Voice</span></span>
      </Link>

      <div className="mx-4 mb-5 rounded-xl bg-ink-2 px-3.5 py-3">
        <p className="text-[11px] uppercase tracking-[.14em] text-white/45">Workspace</p>
        <p className="mt-0.5 truncate text-[13.5px] font-medium">{workspace}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-white/70">
          <span className={cx("h-2 w-2 rounded-full", onDuty ? "bg-live live-dot" : "bg-white/30")} />
          {onDuty ? `${onDuty} AI employee${onDuty > 1 ? "s" : ""} on duty` : "Everyone is paused"}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition",
                active ? "bg-white text-ink font-semibold" : "text-white/70 hover:bg-white/[.06] hover:text-white",
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.3 : 1.9} className={active ? "text-ink" : "text-white/55 group-hover:text-white"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link href="/settings#billing" className="m-4 rounded-xl border border-white/10 px-4 py-3.5 hover:border-white/25 transition">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[.14em] text-white/45"><Wallet size={13} /> Credits</p>
        <p className="mt-1 font-display text-[30px] leading-none">₹{credits.toLocaleString("en-IN")}</p>
        <p className="mt-1.5 text-xs text-signal font-medium">Top up →</p>
      </Link>
    </aside>
  );
}
