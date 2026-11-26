import { draftAgent } from "@/lib/draft";
import { getStore } from "@/lib/store";
import { lockedResponse, unlockedRequest } from "@/lib/gate-server";
import type { Language } from "@/lib/types";

export async function POST(request: Request) {
  if (!(await unlockedRequest())) return lockedResponse();
  const body = await request.json().catch(() => ({}));
  const task = String(body.task ?? "").slice(0, 600).trim();
  if (task.length < 10) return Response.json({ error: "Describe the job in one sentence (at least a few words)." }, { status: 400 });
  const language: Language = ["te", "hi", "en"].includes(body.language) ? body.language : "te";
  const { workspace } = await getStore();
  const draft = await draftAgent(task, language, body.template || undefined, workspace.name);
  return Response.json(draft);
}
