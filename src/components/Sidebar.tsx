"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, Bot, Code2, Headset, LayoutGrid, PhoneCall, Settings, Users } from "lucide-react";
import { cx } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/talk", label: "Talk to AI", icon: Headset },
  { href: "/agents", label: "AI employees", icon: Bot },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/voices", label: "Voices", icon: AudioLines },
  { href: "/developers", label: "Developers", icon: Code2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("flex items-center gap-2", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white">
        <AudioLines size={15} strokeWidth={2} />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">LeadVoice</span>
    </span>
  );
}

export function Sidebar({ workspace, credits, onDuty }: { workspace: string; credits: number; onDuty: number }) {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[240px] flex-col border-r border-line bg-surface lg:flex">
      <Link href="/dashboard" className="px-5 pt-5 pb-6">
        <Logo />
      </Link>

      <div className="mx-3 mb-4 rounded-lg border border-line px-3 py-2.5">
        <p className="truncate text-[13px] font-semibold text-ink">{workspace}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
          <span className={cx("h-1.5 w-1.5 rounded-full", onDuty ? "bg-live live-dot" : "bg-line-2")} />
          {onDuty ? `${onDuty} AI employee${onDuty > 1 ? "s" : ""} on duty` : "Everyone is paused"}
        </p>
      </div>

      <nav className="flex-1 space-y-px px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors",
                active ? "bg-cold-soft font-medium text-ink" : "text-muted hover:bg-paper hover:text-ink",
              )}
            >
              <Icon size={16} strokeWidth={1.75} className={active ? "text-ink" : "text-faint"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-lg border border-line p-3">
        <p className="text-[12px] text-muted">Credits</p>
        <div className="mt-0.5 flex items-baseline justify-between gap-2">
          <p className="text-[20px] font-semibold tracking-[-0.02em] text-ink">₹{credits.toLocaleString("en-IN")}</p>
          <Link href="/settings#billing" className="text-[12.5px] font-medium text-accent hover:text-accent-ink">Top up</Link>
        </div>
      </div>
    </aside>
  );
}

// Phone / tablet navigation strip with the current page highlighted.
export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 text-[13px] [scrollbar-width:none] lg:hidden">
      {NAV.map(({ href, label }) => {
        const active = isActive(path, href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={cx("whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors",
              active ? "bg-ink text-white" : "text-muted hover:bg-cold-soft hover:text-ink")}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
