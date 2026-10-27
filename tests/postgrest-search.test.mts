import assert from "node:assert/strict";
import test from "node:test";
import { buildOrIlikeFilter, normalizeSearchTerm } from "../src/lib/postgrest-search.ts";

test("normalizes and limits user search text", () => {
  assert.equal(normalizeSearchTerm("  kiểm kê  "), "kiểm kê");
  assert.equal(normalizeSearchTerm("x".repeat(200)).length, 120);
});

test("builds an OR filter only from trusted columns", () => {
  assert.equal(
    buildOrIlikeFilter(["title_vi", "keywords"], "trả góp"),
    'title_vi.ilike."*trả góp*",keywords.ilike."*trả góp*"',
  );
  assert.throws(() => buildOrIlikeFilter(["title_vi),status.eq.draft"], "x"), /Invalid search column/);
});

test("quotes and escapes raw PostgREST filter punctuation", () => {
  const filter = buildOrIlikeFilter(["title_vi"], 'x"),status.eq.draft');
  assert.equal(filter, 'title_vi.ilike."*x\\"),status.eq.draft*"');
});