import test from "node:test";
import assert from "node:assert/strict";
import { sendMailSchema } from "../../src/modules/mail/mail.validation.js";

test("sendMailSchema validates recipients correctly", () => {
  // Single string recipient normalized to array
  const single = sendMailSchema.safeParse({
    to: "alice@orvexa.com",
    subject: "Hello",
    body: "Hi Alice",
  });
  assert.equal(single.success, true);
  if (single.success) {
    assert.deepEqual(single.data.to, ["alice@orvexa.com"]);
    assert.deepEqual(single.data.cc, []);
    assert.deepEqual(single.data.bcc, []);
    assert.equal(single.data.subject, "Hello");
    assert.equal(single.data.body, "Hi Alice");
  }

  // Multiple recipients in to, cc, bcc
  const multi = sendMailSchema.safeParse({
    to: ["alice@orvexa.com", "bob@orvexa.com"],
    cc: ["charlie@orvexa.com"],
    bcc: "david@orvexa.com",
    subject: "Meeting",
  });
  assert.equal(multi.success, true);
  if (multi.success) {
    assert.deepEqual(multi.data.to, ["alice@orvexa.com", "bob@orvexa.com"]);
    assert.deepEqual(multi.data.cc, ["charlie@orvexa.com"]);
    assert.deepEqual(multi.data.bcc, ["david@orvexa.com"]);
  }

  // Missing 'to' fails validation
  const noTo = sendMailSchema.safeParse({
    subject: "Test",
    body: "Body",
  });
  assert.equal(noTo.success, false);

  // Empty array in 'to' fails validation
  const emptyTo = sendMailSchema.safeParse({
    to: [],
    subject: "Test",
  });
  assert.equal(emptyTo.success, false);
});

test("sendMailSchema validates attachments", () => {
  // Valid attachmentIds and mixed attachments
  const withAttachments = sendMailSchema.safeParse({
    to: "bob@orvexa.com",
    attachmentIds: ["1", 2],
    attachments: [
      "3",
      4,
      { assetId: "5" },
      {
        publicId: "orvexa/mail/attachment-123",
        originalFilename: "report.pdf",
        mimeType: "application/pdf",
        bytes: 1024,
        secureUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        resourceType: "RAW",
      },
    ],
  });
  assert.equal(withAttachments.success, true);
  if (withAttachments.success) {
    assert.equal(withAttachments.data.attachments?.length, 4);
    assert.equal(withAttachments.data.attachmentIds?.length, 2);
  }
});

test("sendMailSchema validates @orvexa.com email addresses across to, cc, and bcc", () => {
  const result = sendMailSchema.safeParse({
    to: "vishnu@orvexa.com",
    cc: ["john@orvexa.com", "sarah@orvexa.com"],
    bcc: "finance@orvexa.com",
    subject: "Q4 Planning",
    body: "Please find attached the plan.",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data.to, ["vishnu@orvexa.com"]);
    assert.deepEqual(result.data.cc, ["john@orvexa.com", "sarah@orvexa.com"]);
    assert.deepEqual(result.data.bcc, ["finance@orvexa.com"]);
  }
});

test("sendMailSchema validates threading and draft options", () => {
  const withThread = sendMailSchema.safeParse({
    to: "bob@orvexa.com",
    parentMessageId: "123",
    draftId: "456",
  });
  assert.equal(withThread.success, true);
  if (withThread.success) {
    assert.equal(withThread.data.parentMessageId, "123");
    assert.equal(withThread.data.draftId, "456");
  }

  // Invalid parentMessageId format
  const invalidThread = sendMailSchema.safeParse({
    to: "bob@orvexa.com",
    parentMessageId: "invalid-id",
  });
  assert.equal(invalidThread.success, false);
});
