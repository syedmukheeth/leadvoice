import { cacheLife, cacheTag } from "next/cache";
import { PageHeader } from "@/components/ui";
import { maskPhone } from "@/lib/format";
import { getStore, LIVE, STORE_TAG } from "@/lib/store";
import { LeadsView } from "./LeadsView";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  "use cache"; // live data, refreshed every minute and on every change (store.ts)
  cacheLife(LIVE);
  cacheTag(STORE_TAG);
  const { leads, agents } = await getStore();
  return (
    <>
      <PageHeader eyebrow="Everyone your AI agents call" title="Leads" />
      <LeadsView leads={leads.map((l) => ({ ...l, phone: maskPhone(l.phone) }))} agents={agents.map((a) => ({ id: a.id, name: a.name, status: a.status }))} />
    </>
  );
}
