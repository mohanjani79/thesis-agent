import test from "node:test";
import assert from "node:assert/strict";
import { compatConfig, stripFences } from "./openai-compat.ts";

test("compatConfig needs both URL and model, trims trailing slashes", () => {
  assert.equal(compatConfig({}), null);
  assert.equal(compatConfig({ LLM_BASE_URL: "http://localhost:11434/v1" }), null);
  assert.deepEqual(compatConfig({ LLM_BASE_URL: "http://localhost:11434/v1/", LLM_MODEL: "llama3.2", LLM_API_KEY: "" }), {
    baseUrl: "http://localhost:11434/v1",
    apiKey: undefined,
    model: "llama3.2",
  });
});

test("stripFences removes markdown code fences around JSON", () => {
  assert.equal(stripFences('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(stripFences('{"a":1}'), '{"a":1}');
});
