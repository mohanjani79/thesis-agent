"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/store";
import { runCheck } from "@/lib/check";
import { formToAgentInput, parseAgentInput } from "@/lib/validate";
import { clearSession, currentAccount, newToken, requireAccount, requireOwner, setSession } from "@/lib/auth";
import type { Agent } from "@/lib/types";

/** Loads an agent only if it belongs to the signed-in account. */
async function ownAgent(id: string): Promise<Agent | null> {
  const account = await requireAccount();
  const agent = await getStore().getAgent(id);
  return agent && agent.accountId === account.id ? agent : null;
}

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

export type AgentFormState = { error?: string; values?: Record<string, string> };

const FORM_FIELDS = ["name", "symbols", "thesis", "assumptions", "rules", "entryPrices", "notes", "tips"] as const;

/**
 * Creates (id null) or updates an agent from the form. On a validation problem it returns the error
 * together with everything typed, so the form can show the message without losing the text.
 */
export async function saveAgentAction(id: string | null, _prev: AgentFormState, form: FormData): Promise<AgentFormState> {
  const account = await requireAccount();
  const values = Object.fromEntries(FORM_FIELDS.map((f) => [f, String(form.get(f) ?? "")]));
  const parsed = parseAgentInput(formToAgentInput(form));
  if (!parsed.ok) return { error: parsed.error, values };
  try {
    if (id) {
      if (!(await ownAgent(id))) redirect("/");
      await getStore().updateAgent(id, parsed.value);
    } else {
      id = (await getStore().createAgent(parsed.value, account.id)).id;
    }
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e), values };
  }
  revalidatePath(`/agents/${id}`);
  revalidatePath("/");
  redirect(`/agents/${id}`);
}

export async function deleteAgentAction(id: string) {
  await guarded((m) => `/agents/${id}?error=${encodeURIComponent(m)}`, async () => {
    if (!(await ownAgent(id))) redirect("/");
    await getStore().deleteAgent(id);
  });
  revalidatePath("/");
  redirect("/");
}

export async function checkNowAction(id: string) {
  await guarded((m) => `/agents/${id}?error=${encodeURIComponent(m)}`, async () => {
    const agent = await ownAgent(id);
    if (!agent) redirect("/");
    await runCheck(agent);
  });
  revalidatePath(`/agents/${id}`);
  revalidatePath("/");
}

/** Seeds a worked example so the first visit shows what a finished agent looks like. */
export async function createExampleAction() {
  const account = await requireAccount();
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
  }, account.id);
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

// ---- Accounts -------------------------------------------------------------

/** First visitor becomes the owner and takes over any agents made before sign-in existed. */
export async function claimWorkspaceAction(form: FormData) {
  const store = getStore();
  if ((await store.listAccounts()).length > 0) redirect("/welcome");
  const name = String(form.get("name") ?? "").trim() || "Owner";
  const account = await store.createAccount(name.slice(0, 60), "owner", newToken());
  await store.adoptUnownedAgents(account.id);
  await setSession(account.token);
  redirect("/members?welcome=1");
}

export async function inviteMemberAction(form: FormData) {
  await requireOwner();
  const name = String(form.get("name") ?? "").trim().slice(0, 60);
  if (!name) redirect("/members?error=" + encodeURIComponent("Give the invite a name so you know whose link it is."));
  await getStore().createAccount(name, "member", newToken());
  revalidatePath("/members");
  redirect("/members");
}

export async function removeMemberAction(id: string) {
  const owner = await requireOwner();
  if (id === owner.id) redirect("/members");
  await getStore().deleteAccount(id);
  revalidatePath("/members");
  redirect("/members");
}

export async function signOutAction() {
  if (await currentAccount()) await clearSession();
  redirect("/welcome");
}
