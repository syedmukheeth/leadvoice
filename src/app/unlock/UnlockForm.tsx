"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { unlock, type UnlockState } from "./actions";

export function UnlockForm({ configured }: { configured: boolean }) {
  const next = useSearchParams().get("next") ?? "/dashboard";
  const [state, action, pending] = useActionState<UnlockState, FormData>(unlock, {});

  if (!configured) {
    return (
      <div className="rounded-lg border border-line bg-paper p-4 text-[13.5px] leading-relaxed text-muted">
        <p className="font-medium text-ink">No password is set yet</p>
        <p className="mt-1">
          Add a <span className="font-mono text-[12.5px] text-ink">SITE_PASSWORD</span> environment variable in Vercel and redeploy.
          The site opens once it is set.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink">Password</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "unlock-error" : undefined}
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-line-2 aria-invalid:border-hot/50"
        />
      </label>
      {state.error && (
        <p id="unlock-error" role="alert" className="text-[13px] text-hot">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-2.5 text-[14.5px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-ink-2 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Checking…" : <>Unlock <ArrowRight size={15} strokeWidth={2} /></>}
      </button>
      <p className="flex items-center justify-center gap-1.5 pt-1 text-[12.5px] text-faint">
        <LockKeyhole size={13} strokeWidth={1.75} /> You stay signed in on this device for 30 days.
      </p>
    </form>
  );
}
