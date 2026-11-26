import Link from "next/link";
import { Plus } from "lucide-react";
import { Logo, MobileNav, Sidebar } from "@/components/Sidebar";
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
      <div className="lg:pl-[240px]">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-5 lg:px-10">
            <Link href="/dashboard" className="lg:hidden"><Logo /></Link>
            <p className="hidden text-[13px] text-muted lg:block">
              Calls go out <span className="font-medium text-ink">9 AM to 9 PM</span>, India time
            </p>
            <Link
              href="/agents/new"
              aria-label="New AI employee"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[13px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-ink-2 active:scale-[0.98]"
            >
              <Plus size={15} strokeWidth={2} />
              <span className="hidden sm:inline">New AI employee</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
          <MobileNav />
        </header>
        <main className="mx-auto max-w-[1200px] px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
