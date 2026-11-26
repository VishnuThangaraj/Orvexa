import test from "node:test";
import assert from "node:assert/strict";
import {
  updatePreferencesSchema,
  updateProfileSchema,
  usernameAvailabilityQuerySchema,
} from "../../src/modules/profile/profile.validation.js";

test("Profile Validation: updateProfileSchema", () => {
  const valid = updateProfileSchema.safeParse({
    fullName: "  Vishnu Thangaraj  ",
    username: "  Vishnu.Dev_1  ",
    email: "  VISHNU@EXAMPLE.COM  ",
    phone: "+91 98765 43210",
    dob: "1998-05-14",
    gender: "Male",
    address: "Chennai, India",
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.fullName, "Vishnu Thangaraj");
    assert.equal(valid.data.username, "vishnu.dev_1");
    assert.equal(valid.data.email, "vishnu@example.com");
    assert.equal(valid.data.dob, "1998-05-14");
  }

  // Empty optional strings normalize to null
  const cleared = updateProfileSchema.safeParse({
    phone: "",
    dob: "",
    gender: "",
    address: "",
  });
  assert.equal(cleared.success, true);
  if (cleared.success) {
    assert.equal(cleared.data.phone, null);
    assert.equal(cleared.data.dob, null);
    assert.equal(cleared.data.gender, null);
    assert.equal(cleared.data.address, null);
  }

  // Reject empty payload
  assert.equal(updateProfileSchema.safeParse({}).success, false);

  // Reject invalid username characters
  assert.equal(
    updateProfileSchema.safeParse({ username: "bad username!" }).success,
    false,
  );
  assert.equal(
    updateProfileSchema.safeParse({ username: ".leadingdot" }).success,
    false,
  );

  // Reject invalid calendar date like Feb 30
  assert.equal(
    updateProfileSchema.safeParse({ dob: "2000-02-30" }).success,
    false,
  );

  // Reject future birthday
  assert.equal(
    updateProfileSchema.safeParse({ dob: "2999-01-01" }).success,
    false,
  );

  // Reject invalid email
  assert.equal(
    updateProfileSchema.safeParse({ email: "invalid-email" }).success,
    false,
  );
});

test("Profile Validation: usernameAvailabilityQuerySchema", () => {
  const valid = usernameAvailabilityQuerySchema.safeParse({
    username: "  Alex_99 ",
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.username, "alex_99");
  }

  assert.equal(
    usernameAvailabilityQuerySchema.safeParse({ username: "a" }).success,
    false,
  );
  assert.equal(
    usernameAvailabilityQuerySchema.safeParse({ username: "user@name" }).success,
    false,
  );
});

test("Profile Validation: updatePreferencesSchema", () => {
  const valid = updatePreferencesSchema.safeParse({
    theme: "dark",
    language: "en-US",
    timezone: "Asia/Kolkata",
    notificationPreferences: {
      mail: true,
      chat: false,
    },
  });
  assert.equal(valid.success, true);

  assert.equal(updatePreferencesSchema.safeParse({}).success, false);
  assert.equal(
    updatePreferencesSchema.safeParse({ theme: "neon" }).success,
    false,
  );
  assert.equal(
    updatePreferencesSchema.safeParse({ timezone: "Invalid/Zone_123" }).success,
    false,
  );
});
