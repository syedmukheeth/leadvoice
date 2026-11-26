// Run: npm test
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { dataDir } from "./paths.ts";

test("data lives in .data locally and in the temp folder on Vercel", () => {
  assert.equal(dataDir({}, "/srv/app"), path.join("/srv/app", ".data"));
  assert.equal(dataDir({ VERCEL: "1" }, "/var/task"), path.join(os.tmpdir(), "leadvoice"));
});
