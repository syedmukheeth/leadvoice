import Link from "next/link";
import { Plus } from "lucide-react";
import { MobileNav, Sidebar } from "@/components/Sidebar";
import { getStore } from "@/lib/store";

// Every page here shows live workspace data, so pages render on request (with loading.tsx
// as the instant placeholder) instead of being prerendered.
export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const store = await getStore();
  const onDuty = store.agents.filter((a) => a.status === "live").length;
  return (
    <div className="min-h-screen">
      <Sidebar workspace={store.workspace.name} credits={store.workspace.creditsInr} onDuty={onDuty} />
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
          <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-5 py-3 lg:px-10">
            <span className="lg:hidden font-semibold">Lead<span className="font-display italic text-signal text-lg">Voice</span></span>
            <p className="hidden lg:block text-[13px] text-muted">
              Calls go out <b className="font-semibold text-ink">9 AM – 9 PM</b> · India time
            </p>
            <Link
              href="/agents/new"
              aria-label="New AI employee"
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-signal px-3 py-2 text-[13px] font-semibold text-ink hover:brightness-105 sm:px-3.5"
            >
              <Plus size={15} strokeWidth={2.6} /> <span className="hidden sm:inline">New AI employee</span><span className="sm:hidden">New</span>
            </Link>
          </div>
          <MobileNav />
        </header>
        <main className="mx-auto max-w-[1240px] px-5 py-9 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
