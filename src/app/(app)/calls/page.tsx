import { connection } from "next/server";
import { PageHeader } from "@/components/ui";
import { maskPhone } from "@/lib/format";
import { getStore } from "@/lib/store";
import { CallsView } from "./CallsView";

// Live workspace data: render on request (loading.tsx is the instant placeholder).
export const instant = false;

export const metadata = { title: "Calls" };

export default async function CallsPage({ searchParams }: PageProps<"/calls">) {
  await connection();
  const sp = await searchParams;
  const { calls, agents } = await getStore();
  const openId = typeof sp.open === "string" ? sp.open : "";
  // The list goes to the browser without transcripts (loaded when a call is opened) and with masked
  // numbers, which keeps the page light.
  const list = calls.map((c) => ({ ...c, phone: maskPhone(c.phone), transcript: c.id === openId ? c.transcript : [] }));
  return (
    <>
      <PageHeader eyebrow="Every conversation" title="Calls" />
      <CallsView
        calls={list}
        agents={agents.map((a) => ({ id: a.id, name: a.name, outcome: a.outcome, language: a.language }))}
        initialAgent={typeof sp.agent === "string" ? sp.agent : ""}
        initialOpen={openId}
      />
    </>
  );
}
