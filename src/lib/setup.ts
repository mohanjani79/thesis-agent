import { getStore } from "./store.ts";
import { createClient } from "@supabase/supabase-js";
import { anthropicClient } from "./anthropic.ts";
import { compatConfig, listModels } from "./openai-compat.ts";
import { describeAnthropicError } from "./api-error.ts";
import { normaliseSupabaseUrl } from "./supabase-url.ts";

export type CheckState = "ok" | "warn" | "fail";
export interface SetupItem {
  name: string;
  state: CheckState;
  detail: string;
  fix?: string;
}

/** Checks each piece of configuration and reports it in plain language. Never throws. */
export async function runSetupChecks(): Promise<SetupItem[]> {
  const items: SetupItem[] = [];
  const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL, MARKET_PROVIDER, KITE_API_KEY, KITE_ACCESS_TOKEN, CRON_SECRET } = process.env;
  const SUPABASE_URL = normaliseSupabaseUrl(process.env.SUPABASE_URL);
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // Database
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    items.push({
      name: "Database",
      state: "warn",
      detail: "Supabase is not configured, so agents are kept in a temporary file and will be lost on the next deploy.",
      fix: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables, then redeploy.",
    });
  } else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SUPABASE_URL)) {
    items.push({
      name: "Database",
      state: "fail",
      detail: `SUPABASE_URL does not look like a Supabase project URL (got "${SUPABASE_URL.slice(0, 40)}").`,
      fix: "Copy the Project URL from Supabase → Project Settings → Data API. It looks like https://abcdefgh.supabase.co.",
    });
  } else {
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const agents = await db.from("agents").select("id", { count: "exact", head: true });
      const view = await db.from("latest_checks").select("id", { head: true });
      if (agents.error) {
        const msg = agents.error.message;
        const missing = /relation .* does not exist|Could not find the table|schema cache/i.test(msg);
        const unreachable = /fetch failed|ENOTFOUND|ECONNREFUSED|getaddrinfo/i.test(msg);
        items.push({
          name: "Database",
          state: "fail",
          detail: missing
            ? "Connected to Supabase, but the tables do not exist yet."
            : unreachable
              ? "Could not reach the Supabase URL."
              : `Supabase rejected the request: ${msg}`,
          fix: missing
            ? "In Supabase open SQL Editor → New query, paste supabase/migrations/0001_init.sql from the repo, and Run."
            : unreachable
              ? "Check SUPABASE_URL for typos (copy it from Project Settings → Data API) and make sure the project is not paused."
              : "Check that SUPABASE_SERVICE_ROLE_KEY is the service_role (or sb_secret_) key, not the anon/publishable key, and that the URL belongs to the same project.",
        });
      } else if (view.error) {
        items.push({
          name: "Database",
          state: "fail",
          detail: "Tables exist but the latest_checks view is missing, so the home page cannot load.",
          fix: "Run the whole of supabase/migrations/0001_init.sql again; it is safe to re-run.",
        });
      } else {
        items.push({ name: "Database", state: "ok", detail: `Connected to Supabase. ${agents.count ?? 0} agent(s) stored.` });
      }
    } catch (e) {
      items.push({
        name: "Database",
        state: "fail",
        detail: `Could not reach Supabase: ${e instanceof Error ? e.message : String(e)}`,
        fix: "Check SUPABASE_URL for typos and make sure the project is not paused.",
      });
    }
  }

  // Evaluator: an OpenAI-compatible test endpoint (Ollama, Groq) when LLM_BASE_URL is set, else Claude.
  const compat = compatConfig();
  if (compat) {
    try {
      const models = await listModels(compat);
      const known = models.includes(compat.model);
      items.push({
        name: "Thesis evaluation",
        state: known || models.length === 0 ? "ok" : "warn",
        detail: `Test mode: ${compat.model} via ${compat.baseUrl}. Anthropic is not used while LLM_BASE_URL is set.${known ? "" : models.length ? ` The endpoint lists ${models.slice(0, 8).join(", ")}${models.length > 8 ? ", …" : ""}, not ${compat.model}.` : ""}`,
        fix: known || models.length === 0 ? undefined : `Set LLM_MODEL to one of the listed models, or pull it (ollama pull ${compat.model}).`,
      });
    } catch (e) {
      items.push({
        name: "Thesis evaluation",
        state: "fail",
        detail: `LLM_BASE_URL ${compat.baseUrl} did not answer (${e instanceof Error ? e.message : String(e)}).`,
        fix: "A local Ollama is only reachable from the same machine. For the Vercel site use a public endpoint such as https://ollama.com/v1 with LLM_API_KEY, or remove LLM_BASE_URL to use Anthropic.",
      });
    }
  } else if (!ANTHROPIC_API_KEY) {
    items.push({
      name: "Claude evaluation",
      state: "warn",
      detail: "No ANTHROPIC_API_KEY, so only your price rules run; assumptions are not checked against the news.",
      fix: "Create a key at console.anthropic.com, add it in Vercel as ANTHROPIC_API_KEY, then redeploy.",
    });
  } else if (!ANTHROPIC_API_KEY.startsWith("sk-ant-")) {
    items.push({ name: "Claude evaluation", state: "fail", detail: "ANTHROPIC_API_KEY is set but does not look like an Anthropic key (they start with sk-ant-).", fix: "Re-copy the key from console.anthropic.com." });
  } else {
    const model = ANTHROPIC_MODEL || "claude-opus-5-5";
    try {
      // Token counting is free, so it verifies the key and the model name without spending credit.
      await anthropicClient().messages.countTokens({ model, messages: [{ role: "user", content: "ping" }] });
      items.push({ name: "Claude evaluation", state: "ok", detail: `Key and model verified. Model: ${model}.` });
    } catch (e) {
      const msg = describeAnthropicError(e);
      const badModel = /model/i.test(msg) && /not found|invalid|unknown/i.test(msg);
      items.push({
        name: "Claude evaluation",
        state: "fail",
        detail: `Anthropic rejected the request (${msg}).`,
        fix: badModel
          ? `ANTHROPIC_MODEL "${model}" is not a valid model id. Use claude-haiku-4-5, claude-sonnet-5-5 or claude-opus-5-5, or remove the variable.`
          : /workspace/i.test(msg)
            ? "This key was created outside a workspace. Either add ANTHROPIC_WORKSPACE_ID in Vercel (Settings → Workspaces at console.anthropic.com, copy the ID starting with wrkspc_), or create a new key inside a workspace and use that as ANTHROPIC_API_KEY. Then redeploy."
            : /401|authentication/i.test(msg)
            ? "The API key is wrong or revoked. Create a new one at console.anthropic.com and update ANTHROPIC_API_KEY."
            : /credit|billing|402/i.test(msg)
              ? "The Anthropic account has no credit. Add credit under Billing at console.anthropic.com."
              : "Check the key and model in Vercel, then redeploy.",
      });
    }
  }

  // Market data
  const provider = MARKET_PROVIDER ?? (KITE_API_KEY && KITE_ACCESS_TOKEN ? "kite" : "free");
  try {
    const accounts = await getStore().listAccounts();
    items.push(
      accounts.length === 0
        ? { name: "Sign-in", state: "warn", detail: "No one has claimed the workspace yet. The first visitor to /welcome becomes the owner.", fix: "Open /welcome and claim it before sharing the site." }
        : { name: "Sign-in", state: "ok", detail: `${accounts.length} account(s). The owner invites friends from the Members page.` },
    );
  } catch (e) {
    items.push({
      name: "Sign-in",
      state: "fail",
      detail: `The accounts table is missing or unreachable (${e instanceof Error ? e.message : String(e)}).`,
      fix: "Run supabase/migrations/0002_accounts.sql in the Supabase SQL editor, then reload.",
    });
  }

  items.push({
    name: "Market data",
    state: provider === "mock" ? "warn" : "ok",
    detail:
      provider === "kite"
        ? "Zerodha Kite for prices and holdings, Google News for headlines."
        : provider === "mock"
          ? "Simulated prices and headlines."
          : "Yahoo Finance for prices and Google News for headlines, no keys needed. Holdings need Zerodha.",
  });

  // Cron
  items.push(
    CRON_SECRET
      ? { name: "Daily check", state: "ok", detail: "Runs weekdays at 16:30 IST; the endpoint is protected by CRON_SECRET." }
      : { name: "Daily check", state: "warn", detail: "CRON_SECRET is not set, so anyone who finds the URL can trigger a check run.", fix: "Add CRON_SECRET (any long random string) in Vercel and redeploy." },
  );

  return items;
}
