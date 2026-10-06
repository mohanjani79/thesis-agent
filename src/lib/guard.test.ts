import { test } from "node:test";
import assert from "node:assert/strict";
import { guardAdvice } from "./guard.ts";

test("keeps factual sentences", () => {
  const text = "Q2 revenue grew 4% against your assumption of 8%. Your rule about deal wins has no new signal.";
  assert.deepEqual(guardAdvice(text), { text, flags: [] });
});

test("strips advisory sentences", () => {
  const r = guardAdvice("Margins fell 120 bps. You should sell before results. We recommend caution. Target price of ₹1,800 looks fair.");
  assert.equal(r.text, "Margins fell 120 bps.");
  assert.equal(r.flags.length, 3);
});

test("quoting the user's own rule is allowed", () => {
  const text = "Your rule says to revisit the position below ₹1,400, and the price is now ₹1,390.";
  assert.equal(guardAdvice(text).flags.length, 0);
});
