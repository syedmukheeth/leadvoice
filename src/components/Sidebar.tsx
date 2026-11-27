"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, Bot, Headset, LayoutGrid, PhoneCall, Plug, Settings, Users } from "lucide-react";
import { CLIENT } from "@/lib/client";
import { cx } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/talk", label: "Talk to AI", icon: Headset },
  { href: "/agents", label: "AI agents", icon: Bot },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/developers", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("flex items-center gap-2", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white">
        <AudioLines size={15} strokeWidth={2} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[14.5px] font-semibold tracking-[-0.02em] text-ink">{CLIENT.name}</span>
        <span className="block text-[11.5px] text-faint">{CLIENT.portal}</span>
      </span>
    </span>
  );
}

export function Sidebar({ onDuty }: { onDuty: number }) {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[240px] flex-col border-r border-line bg-surface lg:flex">
      <Link href="/dashboard" className="px-5 pt-5 pb-6">
        <Logo />
      </Link>

      <div className="mx-3 mb-4 rounded-lg border border-line px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
          <span className={cx("h-1.5 w-1.5 rounded-full", onDuty ? "bg-live live-dot" : "bg-line-2")} />
          {onDuty ? `${onDuty} AI agent${onDuty > 1 ? "s" : ""} on duty` : "All agents are paused"}
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

      <p className="px-5 pb-4 text-[11.5px] text-faint">Powered by LeadVoice</p>
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
