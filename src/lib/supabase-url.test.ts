import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseSupabaseUrl } from "./supabase-url.ts";

test("normalises pasted supabase urls", () => {
  const want = "https://abcdefghijklmnopqrst.supabase.co";
  assert.equal(normaliseSupabaseUrl(" https://abcdefghijklmnopqrst.supabase.co/ "), want);
  assert.equal(normaliseSupabaseUrl("https://abcdefghijklmnopqrst.supabase.co/rest/v1"), want);
  assert.equal(normaliseSupabaseUrl("https://supabase.com/dashboard/project/abcdefghijklmnopqrst/settings/api"), want);
  assert.equal(normaliseSupabaseUrl(undefined), undefined);
  assert.equal(normaliseSupabaseUrl("https://example.com/"), "https://example.com");
});
