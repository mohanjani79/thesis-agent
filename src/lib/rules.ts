import type { Agent, Quote, TriggeredRule } from "./types.ts";

const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

/**
 * Evaluates the user's numeric rules against current quotes. Pure and
 * deterministic: whether a user's own rule fired is never left to the model.
 */
export function evaluateRules(agent: Agent, quotes: Quote[]): TriggeredRule[] {
  const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
  const fired: TriggeredRule[] = [];

  for (const rule of agent.rules) {
    if (rule.kind === "note" || rule.value === undefined) continue;
    const quote = bySymbol.get(rule.symbol);
    if (!quote) continue;
    const price = quote.lastPrice;

    if (rule.kind === "price_below" && price < rule.value) {
      fired.push({ ruleId: rule.id, text: rule.text, observed: `${rule.symbol} at ₹${fmt(price)}, below your ₹${fmt(rule.value)}` });
    } else if (rule.kind === "price_above" && price > rule.value) {
      fired.push({ ruleId: rule.id, text: rule.text, observed: `${rule.symbol} at ₹${fmt(price)}, above your ₹${fmt(rule.value)}` });
    } else if (rule.kind === "drop_from_entry_pct") {
      const entry = agent.entryPrices[rule.symbol];
      if (!entry) continue;
      const dropPct = ((entry - price) / entry) * 100;
      if (dropPct >= rule.value) {
        fired.push({
          ruleId: rule.id,
          text: rule.text,
          observed: `${rule.symbol} is ${fmt(dropPct)}% below your entry of ₹${fmt(entry)} (your limit: ${fmt(rule.value)}%)`,
        });
      }
    }
  }
  return fired;
}
