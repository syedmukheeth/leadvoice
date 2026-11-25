// Run: node --test --experimental-strip-types src/lib/format.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { maskPhone, pct, pluralOutcome } from "./format.ts";

test("maskPhone hides the middle digits in any format", () => {
  assert.equal(maskPhone("+91 99887 66554"), "+91 99•••••554");
  assert.equal(maskPhone("+919988766554"), "+91 99•••••554");
  assert.equal(maskPhone("9988766554"), "+91 99•••••554");
  assert.equal(maskPhone("12345"), "12345");
});

test("pluralOutcome pluralises the noun before the verb", () => {
  assert.equal(pluralOutcome("Site visit booked", 8), "8 site visits booked");
  assert.equal(pluralOutcome("Order confirmed successfully", 3), "3 orders confirmed successfully");
  assert.equal(pluralOutcome("Documents promised", 2), "2 documents promised");
  assert.equal(pluralOutcome("Candidate shortlisted", 1), "1 candidate shortlisted");
  assert.equal(pluralOutcome("Table booked", 0), "0 tables booked");
});

test("pct shows a dash when there is no data", () => {
  assert.equal(pct(0.456), "46%");
  assert.equal(pct(0, false), "—");
});
