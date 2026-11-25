import { connection } from "next/server";
import { PageHeader } from "@/components/ui";
import { getStore } from "@/lib/store";
import { CallsView } from "./CallsView";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "Calls" };

export default async function CallsPage({ searchParams }: PageProps<"/calls">) {
  await connection();
  const sp = await searchParams;
  const { calls, agents } = await getStore();
  return (
    <>
      <PageHeader eyebrow="Every conversation" title="Calls" />
      <CallsView
        calls={calls}
        agents={agents.map((a) => ({ id: a.id, name: a.name, outcome: a.outcome, language: a.language }))}
        initialAgent={typeof sp.agent === "string" ? sp.agent : ""}
        initialOpen={typeof sp.open === "string" ? sp.open : ""}
      />
    </>
  );
}
