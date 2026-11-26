import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Logo } from "@/components/Sidebar";
import { UnlockForm } from "./UnlockForm";

export const metadata: Metadata = { title: "Private workspace", robots: { index: false, follow: false } };

// Reads SITE_PASSWORD per request, so the page never shows a stale "not set" state that was
// decided at build time.
async function Form() {
  await connection();
  const configured = Boolean(process.env.SITE_PASSWORD) || !process.env.VERCEL;
  return <UnlockForm configured={configured} />;
}

export default function UnlockPage() {
  return (
    <main className="grid min-h-[100dvh] place-items-center p-6">
      <div className="w-full max-w-[360px]">
        <Logo className="mb-8" />
        <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-ink">This workspace is private</h1>
        <p className="mt-1.5 mb-6 text-[14px] leading-relaxed text-muted">Enter the site password to continue.</p>
        <Suspense fallback={<div className="h-[148px]" />}>
          <Form />
        </Suspense>
      </div>
    </main>
  );
}
