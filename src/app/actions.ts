"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/store";
import { runCheck } from "@/lib/check";
import { formToAgentInput, parseAgentInput } from "@/lib/validate";

/** Runs an action body and turns any failure into a redirect carrying the real message. */
async function guarded(onError: (message: string) => string, body: () => Promise<void>) {
  try {
    await body();
  } catch (e) {
    unstable_rethrow(e);
    const msg = e instanceof Error ? e.message : String(e);
    redirect(onError(msg));
  }
}

export async function createAgentAction(form: FormData) {
  const parsed = parseAgentInput(formToAgentInput(form));
  if (!parsed.ok) redirect(`/agents/new?error=${encodeURIComponent(parsed.error)}`);
  await guarded((m) => `/agents/new?error=${encodeURIComponent(m)}`, async () => {
    const agent = await getStore().createAgent(parsed.value);
    redirect(`/agents/${agent.id}`);
  });
}

export async function updateAgentAction(id: string, form: FormData) {
  const parsed = parseAgentInput(formToAgentInput(form));
  if (!parsed.ok) redirect(`/agents/${id}/edit?error=${encodeURIComponent(parsed.error)}`);
  await guarded((m) => `/agents/${id}/edit?error=${encodeURIComponent(m)}`, async () => {
    await getStore().updateAgent(id, parsed.value);
  });
  revalidatePath(`/agents/${id}`);
  redirect(`/agents/${id}`);
}

export async function deleteAgentAction(id: string) {
  await guarded((m) => `/agents/${id}?error=${encodeURIComponent(m)}`, async () => {
    await getStore().deleteAgent(id);
  });
  revalidatePath("/");
  redirect("/");
}

export async function checkNowAction(id: string) {
  await guarded((m) => `/agents/${id}?error=${encodeURIComponent(m)}`, async () => {
    const agent = await getStore().getAgent(id);
    if (!agent) redirect("/");
    await runCheck(agent);
  });
  revalidatePath(`/agents/${id}`);
  revalidatePath("/");
}

/** Seeds a worked example so the first visit shows what a finished agent looks like. */
export async function createExampleAction() {
  await guarded((m) => `/?error=${encodeURIComponent(m)}`, async () => {
  const agent = await getStore().createAgent({
    name: "Infosys: services growth comes back",
    symbols: ["INFY"],
    thesis:
      "Infosys is cheap for a company that still wins large deals. I own it for the day BFSI spending in the US recovers and growth guidance moves back above 5%. GenAI work should expand deal sizes rather than cannibalise them.",
    assumptions: [
      "FY27 constant-currency growth guidance stays at or above 5%",
      "Large deal TCV stays above $2bn a quarter",
      "Operating margin holds above 20%",
      "Attrition stays below 15%",
    ],
    notes: "Bought after Q4 FY26 results. Review every quarter after the call, not on daily price moves.",
    tips: "A friend at a fund says BFSI budgets open up in H2. Treat as unverified.",
    rules: [
      { id: "r1", kind: "price_below", symbol: "INFY", value: 1350, text: "Below ₹1,350 the market disagrees with me hard enough to re-read the thesis" },
      { id: "r2", kind: "drop_from_entry_pct", symbol: "INFY", value: 12, text: "A 12% fall from my entry means something I did not predict happened" },
      { id: "r3", kind: "note", symbol: "INFY", text: "Watch the BFSI commentary on each results call" },
    ],
    entryPrices: { INFY: 1540 },
  });
  try {
    await runCheck(agent);
  } catch (e) {
    unstable_rethrow(e);
    const msg = e instanceof Error ? e.message : String(e);
    redirect(`/agents/${agent.id}?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/");
  redirect(`/agents/${agent.id}`);
  });
}
