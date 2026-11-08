import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { hashToken, getTokenExpiryDate } from "../../src/common/utils/hash.js";

test("Task 1.1: hashToken produces valid SHA-256 hex string", () => {
  const token = "sample-refresh-token-12345";
  const hash = hashToken(token);

  assert.equal(typeof hash, "string");
  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);

  // Determinism check
  const hashAgain = hashToken(token);
  assert.equal(hash, hashAgain);

  // Difference check
  const differentHash = hashToken("sample-refresh-token-67890");
  assert.notEqual(hash, differentHash);
});

test("Task 1.1: getTokenExpiryDate correctly parses JWT exp claim", () => {
  const secret = "test-secret";
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expInSeconds = nowInSeconds + 3600; // 1 hour in the future

  const token = jwt.sign({ id: "1", role: "MEMBER" }, secret, {
    expiresIn: "1h",
  });

  const expiryDate = getTokenExpiryDate(token);
  assert.ok(expiryDate instanceof Date);

  const diffMs = Math.abs(expiryDate.getTime() - expInSeconds * 1000);
  // Difference between calculated exp and sign exp should be less than 2000 ms
  assert.ok(diffMs < 2000, `Expected diffMs < 2000, got ${diffMs}`);
});

test("Task 1.1: getTokenExpiryDate falls back safely on invalid token", () => {
  const invalidToken = "not-a-jwt";
  const before = Date.now();
  const fallbackMs = 12 * 60 * 60 * 1000;
  const expiryDate = getTokenExpiryDate(invalidToken, fallbackMs);
  const after = Date.now();

  assert.ok(expiryDate instanceof Date);
  assert.ok(expiryDate.getTime() >= before + fallbackMs);
  assert.ok(expiryDate.getTime() <= after + fallbackMs + 100);
});
