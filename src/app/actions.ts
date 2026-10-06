"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/store";
import { runCheck } from "@/lib/check";
import { formToAgentInput, parseAgentInput } from "@/lib/validate";

export async function createAgentAction(form: FormData) {
  const parsed = parseAgentInput(formToAgentInput(form));
  if (!parsed.ok) redirect(`/agents/new?error=${encodeURIComponent(parsed.error)}`);
  const agent = await getStore().createAgent(parsed.value);
  redirect(`/agents/${agent.id}`);
}

export async function updateAgentAction(id: string, form: FormData) {
  const parsed = parseAgentInput(formToAgentInput(form));
  if (!parsed.ok) redirect(`/agents/${id}/edit?error=${encodeURIComponent(parsed.error)}`);
  await getStore().updateAgent(id, parsed.value);
  revalidatePath(`/agents/${id}`);
  redirect(`/agents/${id}`);
}

export async function deleteAgentAction(id: string) {
  await getStore().deleteAgent(id);
  revalidatePath("/");
  redirect("/");
}

export async function checkNowAction(id: string) {
  const agent = await getStore().getAgent(id);
  if (agent) await runCheck(agent);
  revalidatePath(`/agents/${id}`);
  revalidatePath("/");
}
