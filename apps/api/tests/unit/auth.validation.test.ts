import test from "node:test";
import assert from "node:assert/strict";
import {
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  sessionIdParamSchema,
} from "../../src/modules/auth/auth.validation.js";

test("Task 3.1: loginSchema validation", () => {
  // Valid payload with whitespace and uppercase
  const valid = loginSchema.safeParse({
    email: "  TEST@EXAMPLE.COM  ",
    password: "Password123",
    deviceName: "Chrome on macOS",
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.email, "test@example.com");
  }

  // Invalid email
  const invalidEmail = loginSchema.safeParse({
    email: "not-an-email",
    password: "Password123",
  });
  assert.equal(invalidEmail.success, false);

  // Short password
  const shortPass = loginSchema.safeParse({
    email: "test@example.com",
    password: "123",
  });
  assert.equal(shortPass.success, false);
});

test("Task 3.1: logoutSchema & refreshTokenSchema validation", () => {
  assert.equal(logoutSchema.safeParse({ refreshToken: "sample-token" }).success, true);
  assert.equal(logoutSchema.safeParse({ refreshToken: "" }).success, false);
  assert.equal(logoutSchema.safeParse({}).success, false);

  assert.equal(refreshTokenSchema.safeParse({ refreshToken: "sample-token" }).success, true);
  assert.equal(refreshTokenSchema.safeParse({ refreshToken: "" }).success, false);
});

test("Task 3.1: sessionIdParamSchema validation", () => {
  assert.equal(sessionIdParamSchema.safeParse({ id: "1" }).success, true);
  assert.equal(sessionIdParamSchema.safeParse({ id: "9007199254740991" }).success, true);
  assert.equal(sessionIdParamSchema.safeParse({ id: "abc" }).success, false);
  assert.equal(sessionIdParamSchema.safeParse({ id: "-5" }).success, false);
  assert.equal(sessionIdParamSchema.safeParse({ id: "1.5" }).success, false);
});
