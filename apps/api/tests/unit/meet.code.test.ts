import test from "node:test";
import assert from "node:assert/strict";
import {
  generateMeetingCode,
  normalizeMeetingCode,
} from "../../src/modules/meet/meet.code.js";

test("generateMeetingCode produces valid 3-4-3 letter codes", () => {
  for (let i = 0; i < 20; i++) {
    const code = generateMeetingCode();
    assert.match(
      code,
      /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
      `Generated code ${code} must match 3-4-3 lowercase format`,
    );
  }
});

test("normalizeMeetingCode correctly parses and normalizes formats", () => {
  // Exact format
  assert.equal(normalizeMeetingCode("abc-defg-hij"), "abc-defg-hij");

  // Uppercase
  assert.equal(normalizeMeetingCode("ABC-DEFG-HIJ"), "abc-defg-hij");

  // Without hyphens
  assert.equal(normalizeMeetingCode("abcdefghij"), "abc-defg-hij");
  assert.equal(normalizeMeetingCode("ABCDEFGHIJ"), "abc-defg-hij");

  // Full URL
  assert.equal(
    normalizeMeetingCode("https://orvexa.com/meet/abc-defg-hij"),
    "abc-defg-hij",
  );
  assert.equal(
    normalizeMeetingCode("http://localhost:5155/meet/xyz-uvwx-rst?auth=1"),
    "xyz-uvwx-rst",
  );

  // Whitespace
  assert.equal(normalizeMeetingCode("  abc-defg-hij  "), "abc-defg-hij");

  // Invalid formats
  assert.equal(normalizeMeetingCode(""), null);
  assert.equal(normalizeMeetingCode("invalid"), null);
  assert.equal(normalizeMeetingCode("123-4567-890"), null);
  assert.equal(normalizeMeetingCode("ab-cde-fgh"), null);
});
