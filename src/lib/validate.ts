import { z } from "zod";
import type { AgentInput } from "./types.ts";

const symbol = z.string().trim().toUpperCase().regex(/^[A-Z0-9&-]{1,20}$/, "Use the NSE trading symbol, e.g. INFY");

export const AgentInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  symbols: z.array(symbol).min(1).max(10),
  thesis: z.string().trim().max(4000).default(""),
  assumptions: z.array(z.string().trim().min(1).max(400)).max(10).default([]),
  notes: z.string().trim().max(4000).default(""),
  tips: z.string().trim().max(4000).default(""),
  rules: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum(["price_below", "price_above", "drop_from_entry_pct", "note"]),
        symbol,
        value: z.number().finite().optional(),
        text: z.string().trim().min(1).max(400),
      }),
    )
    .max(20)
    .default([]),
  entryPrices: z.record(symbol, z.number().positive()).default({}),
});

export function parseAgentInput(data: unknown): { ok: true; value: AgentInput } | { ok: false; error: string } {
  const r = AgentInputSchema.safeParse(data);
  if (r.success) return { ok: true, value: r.data };
  return { ok: false, error: r.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ") };
}

/** Converts the HTML form (textareas, one item per line) into AgentInput. */
export function formToAgentInput(form: FormData): unknown {
  const lines = (name: string) =>
    String(form.get(name) ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  const symbols = String(form.get("symbols") ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  // Rules are typed one per line as:  SYMBOL below 1400 | my words
  //                                   SYMBOL above 2000 | my words
  //                                   SYMBOL drop 10% | my words
  //                                   SYMBOL note | my words
  const rules = lines("rules").map((line, i) => {
    const [spec, ...rest] = line.split("|");
    const text = rest.join("|").trim() || spec.trim();
    const m = spec.trim().match(/^(\S+)\s+(below|above|drop|note)\s*([\d.]+)?%?$/i);
    if (!m) return { id: `r${i + 1}`, kind: "note", symbol: symbols[0] ?? "", text: line };
    const kindMap = { below: "price_below", above: "price_above", drop: "drop_from_entry_pct", note: "note" } as const;
    const kind = kindMap[m[2].toLowerCase() as keyof typeof kindMap];
    return { id: `r${i + 1}`, kind, symbol: m[1].toUpperCase(), value: m[3] ? Number(m[3]) : undefined, text };
  });

  const entryPrices: Record<string, number> = {};
  for (const line of lines("entryPrices")) {
    const [s, p] = line.split(/[\s:=]+/);
    if (s && p && Number(p) > 0) entryPrices[s.toUpperCase()] = Number(p);
  }

  return {
    name: form.get("name"),
    symbols,
    thesis: form.get("thesis") ?? "",
    assumptions: lines("assumptions"),
    notes: form.get("notes") ?? "",
    tips: form.get("tips") ?? "",
    rules,
    entryPrices,
  };
}
