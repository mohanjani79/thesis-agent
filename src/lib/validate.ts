import { z } from "zod";
import type { AgentInput } from "./types.ts";

const symbol = z.string().trim().toUpperCase().regex(/^[A-Z0-9&-]{1,20}$/, "Use the NSE trading symbol, e.g. INFY");

export const AgentInputSchema = z.object({
  name: z.string().trim().min(1, "Give the agent a name").max(120, "Keep the name under 120 characters"),
  symbols: z.array(symbol).min(1, "Add at least one NSE symbol").max(10, "Up to 10 symbols per agent"),
  thesis: z.string().trim().max(8000, "Keep the thesis under 8,000 characters").default(""),
  assumptions: z.array(z.string().trim().min(1).max(600, "Keep each assumption under 600 characters")).max(30, "Up to 30 assumptions, one per line").default([]),
  notes: z.string().trim().max(8000, "Keep notes under 8,000 characters").default(""),
  tips: z.string().trim().max(8000, "Keep tips under 8,000 characters").default(""),
  rules: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum(["price_below", "price_above", "drop_from_entry_pct", "note"]),
        symbol,
        value: z.number().finite().optional(),
        text: z.string().trim().min(1).max(600, "Keep each rule under 600 characters"),
      }),
    )
    .max(40, "Up to 40 rules, one per line")
    .default([]),
  entryPrices: z.record(symbol, z.number().positive()).default({}),
});

export function parseAgentInput(data: unknown): { ok: true; value: AgentInput } | { ok: false; error: string } {
  const r = AgentInputSchema.safeParse(data);
  if (r.success) return { ok: true, value: r.data };
  const FIELD: Record<string, string> = { name: "Agent name", symbols: "NSE symbols", thesis: "Thesis", assumptions: "Assumptions", notes: "Notes", tips: "Tips", rules: "Rules", entryPrices: "Entry prices" };
  const seen = new Set<string>();
  const messages = r.error.issues
    .map((i) => `${FIELD[String(i.path[0])] ?? "Input"}: ${i.message}`)
    .filter((m) => !seen.has(m) && seen.add(m));
  return { ok: false, error: messages.join(". ") };
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
