import Link from "next/link";
import { Headset } from "lucide-react";
import { Logo, MobileNav, Sidebar } from "@/components/Sidebar";
import { StudioFooter } from "@/components/StudioFooter";
import { getStore } from "@/lib/store";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const store = await getStore();
  const onDuty = store.agents.filter((a) => a.status === "live").length;
  return (
    <div className="flex min-h-screen flex-col">
      <Sidebar onDuty={onDuty} />
      <div className="flex flex-1 flex-col lg:pl-[240px]">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-5 lg:px-10">
            <Link href="/dashboard" className="lg:hidden"><Logo /></Link>
            <p className="hidden text-[13px] text-muted lg:block">
              Calls go out <span className="font-medium text-ink">9 AM to 9 PM</span>, India time
            </p>
            <Link
              href="/talk"
              aria-label="Talk to AI"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[13px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-ink-2 active:scale-[0.98]"
            >
              <Headset size={15} strokeWidth={2} />
              <span>Talk to AI</span>
            </Link>
          </div>
          <MobileNav />
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-8 lg:px-10 lg:py-10">{children}</main>
        <StudioFooter />
      </div>
    </div>
  );
}
