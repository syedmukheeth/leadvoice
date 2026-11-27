import { cacheLife, cacheTag } from "next/cache";
import { Headphones, Mic, MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { languageById, voiceById } from "@/lib/catalog";
import { getStore, LIVE, STORE_TAG } from "@/lib/store";
import { TalkPicker } from "./TalkPicker";

export const metadata = { title: "Talk to AI" };

export default async function TalkPage() {
  "use cache"; // live data, refreshed every minute and on every change (store.ts)
  cacheLife(LIVE);
  cacheTag(STORE_TAG);
  const { agents } = await getStore();
  const list = agents.map((a) => ({
    id: a.id, name: a.name, role: a.role, outcome: a.outcome, live: a.status === "live",
    languageLabel: languageById(a.language).label, native: languageById(a.language).native,
    voice: voiceById(a.voiceId, a.language).name,
  }));
  return (
    <>
      <PageHeader eyebrow="Talk to your AI agents from the browser, just like a phone call." title="Talk to AI" />
      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
        <span className="flex items-center gap-1.5"><Mic size={14} strokeWidth={1.75} /> Allow the microphone when asked</span>
        <span className="flex items-center gap-1.5"><Headphones size={14} strokeWidth={1.75} /> Headphones avoid echo</span>
        <span className="flex items-center gap-1.5"><MessageSquareText size={14} strokeWidth={1.75} /> You can also type replies</span>
      </div>
      <TalkPicker agents={list} />
    </>
  );
}
