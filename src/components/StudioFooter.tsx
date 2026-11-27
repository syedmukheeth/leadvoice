"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, Globe } from "lucide-react";

// The studio credit that closes every SAMPeer Studio site: a signed name, then the studio's
// website and Instagram side by side. When it scrolls into view, a marker draws under the name
// and a glint crosses both buttons (globals.css, "Studio credit").
const CREDIT = {
  studio: "SAMPeer Studio",
  url: "https://sampeer-studio.vercel.app/",
  instagram: "https://www.instagram.com/syedmukheeth.29/",
};

function Instagram({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function StudioFooter() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("is-in"); io.disconnect(); }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer className="border-t border-line">
      <div ref={ref} className="credit mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-5 py-8 lg:flex-row lg:justify-center lg:gap-7 lg:px-10">
        <p className="flex items-baseline gap-3 whitespace-nowrap">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Created by</span>
          <span className="credit-name text-[22px] font-semibold leading-none tracking-[-0.025em] text-ink lg:text-[24px]">{CREDIT.studio}</span>
        </p>
        <span aria-hidden className="hidden h-9 w-px bg-line lg:block" />
        <ul className="grid w-full max-w-[22rem] grid-cols-2 gap-3 sm:flex sm:w-auto sm:max-w-none">
          <li>
            <a href={CREDIT.url} target="_blank" rel="noopener noreferrer" className="credit-btn credit-btn-accent">
              <Globe size={16} strokeWidth={1.9} />
              <span><span className="sr-only">{CREDIT.studio} </span>Website</span>
              <ArrowUpRight size={14} strokeWidth={2} className="credit-btn-arrow" />
            </a>
          </li>
          <li>
            <a href={CREDIT.instagram} target="_blank" rel="noopener noreferrer" className="credit-btn">
              <Instagram />
              <span>Instagram<span className="sr-only">, {CREDIT.studio}</span></span>
              <ArrowUpRight size={14} strokeWidth={2} className="credit-btn-arrow" />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
