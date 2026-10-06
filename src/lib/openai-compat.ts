import { z } from "zod";

// A minimal client for any OpenAI-compatible chat endpoint: Ollama (local or
// ollama.com), Groq, OpenRouter and friends. Used for free testing; Anthropic
// stays the production evaluator. No SDK, just fetch.

export interface CompatConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
}

/** Returns the config when LLM_BASE_URL and LLM_MODEL are set, else null. */
export function compatConfig(env: Record<string, string | undefined> = process.env): CompatConfig | null {
  const baseUrl = env.LLM_BASE_URL?.trim().replace(/\/+$/, "");
  const model = env.LLM_MODEL?.trim();
  if (!baseUrl || !model) return null;
  return { baseUrl, apiKey: env.LLM_API_KEY?.trim() || undefined, model };
}

function headersFor(cfg: CompatConfig): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (cfg.apiKey) h.authorization = `Bearer ${cfg.apiKey}`;
  return h;
}

/**
 * Asks for JSON matching `schema` and validates it. Tries strict JSON-schema output first; if the
 * endpoint rejects that (Groq only supports it on some models), retries in plain JSON mode with the
 * schema spelled out in the prompt. Throws with a readable message on any failure.
 */
export async function chatJson<T extends z.ZodType>(cfg: CompatConfig, system: string, user: string, schema: T, timeoutMs = 90_000): Promise<z.infer<T>> {
  const jsonSchema = z.toJSONSchema(schema);
  const base = { model: cfg.model, temperature: 0 };
  const strict = {
    ...base,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_schema", json_schema: { name: "evaluation", strict: true, schema: jsonSchema } },
  };
  const loose = {
    ...base,
    messages: [
      { role: "system", content: `${system}\n\nRespond with a single JSON object matching this JSON schema and nothing else:\n${JSON.stringify(jsonSchema)}` },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  };

  let res = await post(cfg, strict, timeoutMs);
  if (res.status === 400 && /response_format|json_schema|structured/i.test(await res.clone().text())) {
    res = await post(cfg, loose, timeoutMs);
  }
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`${cfg.baseUrl} answered ${res.status}${text ? `: ${text}` : ""}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string | null; refusal?: string | null } }> };
  const msg = data.choices?.[0]?.message;
  if (msg?.refusal) throw new Error(`The model refused: ${msg.refusal}`);
  const content = msg?.content;
  if (!content) throw new Error("The model returned no content");
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(content));
  } catch {
    throw new Error(`The model did not return valid JSON (${content.slice(0, 120)}…)`);
  }
  const r = schema.safeParse(parsed);
  if (!r.success) throw new Error(`The model's JSON did not match the expected shape (${r.error.issues[0]?.message ?? "unknown"})`);
  return r.data;
}

async function post(cfg: CompatConfig, body: unknown, timeoutMs: number): Promise<Response> {
  try {
    return await fetch(`${cfg.baseUrl}/chat/completions`, { method: "POST", headers: headersFor(cfg), body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    throw new Error(`Could not reach ${cfg.baseUrl} (${e instanceof Error ? e.message : String(e)})`);
  }
}

/** Lists model ids the endpoint offers, for the setup page. */
export async function listModels(cfg: CompatConfig): Promise<string[]> {
  const res = await fetch(`${cfg.baseUrl}/models`, { headers: headersFor(cfg), signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${cfg.baseUrl}/models answered ${res.status}`);
  const data = (await res.json()) as { data?: Array<{ id: string }> };
  return (data.data ?? []).map((m) => m.id);
}

/** Small local models sometimes wrap JSON in ```json fences even when asked not to. */
export function stripFences(s: string): string {
  const m = s.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1] : s.trim();
}
