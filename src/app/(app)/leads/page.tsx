import { connection } from "next/server";
import { PageHeader } from "@/components/ui";
import { getStore } from "@/lib/store";
import { LeadsView } from "./LeadsView";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  await connection();
  const { leads, agents } = await getStore();
  return (
    <>
      <PageHeader eyebrow="Everyone your AI agents call" title="Leads" />
      <LeadsView leads={leads} agents={agents.map((a) => ({ id: a.id, name: a.name, status: a.status }))} />
    </>
  );
}
