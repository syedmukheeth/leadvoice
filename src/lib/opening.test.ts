// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { openingLine } from "./opening.ts";

test("openingLine drops the name placeholder and its honorific", () => {
  assert.equal(openingLine("నమస్కారం {name} గారు, నేను కావ్య."), "నమస్కారం, నేను కావ్య.");
  assert.equal(openingLine("नमस्ते {name} जी, मैं मीरा।"), "नमस्ते, मैं मीरा।");
  assert.equal(openingLine("Hi {name}, this is Arjun."), "Hi, this is Arjun.");
  assert.equal(openingLine("Hello, thank you for calling."), "Hello, thank you for calling.");
});
