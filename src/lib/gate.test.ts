// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { gateToken, isUnlocked, safeEqual, safeNext } from "./gate.ts";

function withEnv(env: Record<string, string | undefined>, fn: () => Promise<void>) {
  return async () => {
    const saved = { SITE_PASSWORD: process.env.SITE_PASSWORD, VERCEL: process.env.VERCEL };
    for (const [k, v] of Object.entries(env)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    try {
      await fn();
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  };
}

test("gate token is stable for a password and changes with it", async () => {
  assert.equal(await gateToken("first-test-pass"), await gateToken("first-test-pass"));
  assert.notEqual(await gateToken("first-test-pass"), await gateToken("second-test-pass"));
  assert.match(await gateToken("x"), /^[0-9a-f]{64}$/);
});

test("safeEqual compares exactly", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});

test("safeNext only allows same-site paths", () => {
  assert.equal(safeNext("/calls?open=cl_1"), "/calls?open=cl_1");
  assert.equal(safeNext("//evil.example"), "/dashboard");
  assert.equal(safeNext("/\\evil.example"), "/dashboard");
  assert.equal(safeNext("https://evil.example"), "/dashboard");
  assert.equal(safeNext(null), "/dashboard");
});

test("no gate locally without a password", withEnv({ SITE_PASSWORD: undefined, VERCEL: undefined }, async () => {
  assert.equal(await isUnlocked(undefined), true);
}));

test("on Vercel the site stays locked until a password is set", withEnv({ SITE_PASSWORD: undefined, VERCEL: "1" }, async () => {
  assert.equal(await isUnlocked(undefined), false);
  assert.equal(await isUnlocked("anything"), false);
}));

test("with a password, only the right cookie unlocks", withEnv({ SITE_PASSWORD: "gate-test-pass", VERCEL: "1" }, async () => {
  assert.equal(await isUnlocked(undefined), false);
  assert.equal(await isUnlocked(await gateToken("wrong-pass")), false);
  assert.equal(await isUnlocked(await gateToken("gate-test-pass")), true);
}));
