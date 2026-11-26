"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui";
import { createApiKey, saveWebhook } from "@/lib/actions";

const field = "w-full rounded-lg border border-line bg-paper px-3.5 py-2 text-[13.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-line-2 focus:bg-surface";

export function KeyMaker() {
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  if (secret) {
    return (
      <div className="rounded-lg border border-accent/20 bg-accent-soft p-4">
        <p className="text-[13px] font-semibold text-ink">Copy this key now. It won&apos;t be shown again.</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-surface px-3 py-2 font-mono text-[12px]">{secret}</code>
          <Button variant="ghost" className="py-2" aria-label={copied ? "Copied" : "Copy key"} onClick={async () => { await navigator.clipboard.writeText(secret); setCopied(true); }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </Button>
        </div>
        <button onClick={() => { setSecret(""); setLabel(""); setCopied(false); }} className="mt-3 text-[13px] font-medium text-muted hover:text-ink">Done</button>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <input className={field} placeholder="Key name, e.g. Website form" value={label} onChange={(e) => setLabel(e.target.value)} />
      <Button disabled={pending} onClick={() => start(async () => setSecret(await createApiKey(label)))}>Create key</Button>
    </div>
  );
}

export function WebhookForm({ current }: { current: string }) {
  const [url, setUrl] = useState(current);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <input className={field} placeholder="https://your-crm.com/hooks/leadvoice" value={url} onChange={(e) => { setUrl(e.target.value); setSaved(false); }} />
      <Button variant={saved ? "ghost" : "primary"} disabled={pending || url === current} onClick={() => start(async () => { await saveWebhook(url); setSaved(true); })}>
        {saved ? <><Check size={15} /> Saved</> : "Save"}
      </Button>
    </div>
  );
}
