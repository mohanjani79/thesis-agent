import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRules } from "./rules.ts";
import { computeStatus } from "./status.ts";
import type { Agent } from "./types.ts";

const agent: Agent = {
  id: "a1",
  name: "Test",
  symbols: ["INFY"],
  thesis: "",
  assumptions: [],
  notes: "",
  tips: "",
  entryPrices: { INFY: 1600 },
  rules: [
    { id: "r1", kind: "price_below", symbol: "INFY", value: 1400, text: "Exit under 1400" },
    { id: "r2", kind: "price_above", symbol: "INFY", value: 2000, text: "Review above 2000" },
    { id: "r3", kind: "drop_from_entry_pct", symbol: "INFY", value: 10, text: "Rethink after a 10% fall" },
    { id: "r4", kind: "note", symbol: "INFY", text: "Watch deal wins" },
  ],
  createdAt: "",
  updatedAt: "",
};
const q = (lastPrice: number) => [{ symbol: "INFY", lastPrice, changePct: 0, asOf: "" }];

test("no rule fires inside the band", () => {
  assert.deepEqual(evaluateRules(agent, q(1500)), []);
});

test("price_below and drop_from_entry fire together", () => {
  const ids = evaluateRules(agent, q(1390)).map((r) => r.ruleId);
  assert.deepEqual(ids, ["r1", "r3"]);
});

test("drop_from_entry fires at exactly the threshold", () => {
  assert.deepEqual(evaluateRules(agent, q(1440)).map((r) => r.ruleId), ["r3"]);
});

test("price_above fires", () => {
  assert.deepEqual(evaluateRules(agent, q(2100)).map((r) => r.ruleId), ["r2"]);
});

test("missing quote fires nothing", () => {
  assert.deepEqual(evaluateRules(agent, []), []);
});

test("status is derived from parts", () => {
  const p = (verdict: "supported" | "challenged" | "no_signal") => ({ assumption: "", verdict, evidence: "" });
  assert.equal(computeStatus([p("supported"), p("no_signal")], []), "intact");
  assert.equal(computeStatus([p("supported"), p("supported"), p("challenged")], []), "watch");
  assert.equal(computeStatus([p("supported"), p("challenged")], []), "broken");
  assert.equal(computeStatus([], [{ ruleId: "r", text: "", observed: "" }]), "broken");
});
