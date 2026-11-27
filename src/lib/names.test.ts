// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { namesIn } from "./names.ts";

test("namesIn finds project, place and document names", () => {
  assert.deepEqual(
    namesIn("ASRG Constructions layout, Kurnool bypass near NH-44.\nDTCP approved, RERA registered.\nPlots 150 / 200 / 267 sq yd at ₹9,000 per sq yd.\nFree pickup from Kurnool bus stand on weekends."),
    ["ASRG Constructions", "Kurnool", "NH-44", "DTCP", "RERA"],
  );
  assert.deepEqual(
    namesIn("Needed: PAN, Aadhaar, last 3 payslips, 6-month bank statement.\nUpload link: sent on WhatsApp."),
    ["PAN", "Aadhaar", "WhatsApp"],
  );
});

test("namesIn skips sentence-start words and clock words", () => {
  assert.deepEqual(namesIn("Office: Kurnool, near the bus stand. 9 AM – 7 PM, all days."), ["Kurnool"]);
  assert.deepEqual(namesIn("Open all days. Parking available."), []);
  assert.deepEqual(namesIn(""), []);
});
