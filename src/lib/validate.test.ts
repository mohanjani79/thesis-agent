import { test } from "node:test";
import assert from "node:assert/strict";
import { formToAgentInput, parseAgentInput } from "./validate.ts";

test("form lines become rules and entry prices", () => {
  const f = new FormData();
  f.set("name", "Infy");
  f.set("symbols", "infy, tcs");
  f.set("assumptions", "Growth stays above 5%\nMargins hold");
  f.set("rules", "INFY below 1400 | Exit under 1400\nINFY drop 10% | Rethink\nTCS note | watch headcount\nfree text rule");
  f.set("entryPrices", "INFY 1620\nTCS: 3100");
  const r = parseAgentInput(formToAgentInput(f));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.value.symbols, ["INFY", "TCS"]);
  assert.equal(r.value.assumptions.length, 2);
  assert.deepEqual(r.value.rules.map((x) => [x.kind, x.symbol, x.value]), [
    ["price_below", "INFY", 1400],
    ["drop_from_entry_pct", "INFY", 10],
    ["note", "TCS", undefined],
    ["note", "INFY", undefined],
  ]);
  assert.deepEqual(r.value.entryPrices, { INFY: 1620, TCS: 3100 });
});

test("rejects missing symbols", () => {
  const r = parseAgentInput({ name: "x", symbols: [] });
  assert.equal(r.ok, false);
});
