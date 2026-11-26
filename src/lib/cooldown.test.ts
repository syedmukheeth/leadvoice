// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { REST_MS, createCooldown } from "./cooldown.ts";

test("resting models are skipped until their rest ends", () => {
  let t = 0;
  const c = createCooldown(() => t);
  const models = ["flash", "lite", "lite-2"];
  c.rest("flash", REST_MS.quota);
  assert.deepEqual(c.order(models), ["lite", "lite-2"]);
  t = REST_MS.quota;
  assert.deepEqual(c.order(models), models);
});

test("a model that answers again is used right away", () => {
  const c = createCooldown(() => 0);
  c.rest("flash", REST_MS.timeout);
  c.clear("flash");
  assert.deepEqual(c.order(["flash", "lite"]), ["flash", "lite"]);
});

test("when every model is resting, all are tried rather than none", () => {
  const c = createCooldown(() => 0);
  c.rest("flash", REST_MS.overloaded);
  c.rest("lite", REST_MS.overloaded);
  assert.deepEqual(c.order(["flash", "lite"]), ["flash", "lite"]);
});
