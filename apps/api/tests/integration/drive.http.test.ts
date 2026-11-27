import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import sharp from "sharp";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";
import env from "../../src/config/env.js";

describe("Drive HTTP Upload, Stream Preview, Thumbnail & Download Integration Tests", () => {
  let server: Server;
  let baseUrl = "";
  let user: { id: bigint; email: string };
  let accessToken = "";
  let uploadedPdfId = "";
  let uploadedImageId = "";
  let pdfBytes: Buffer;
  let pngBytes: Buffer;
  const allowedOrigin = env.CLIENT_ORIGIN.split(",")[0]?.trim() || "http://localhost:5155";

  before(async () => {
    const unique = Date.now();
    user = await prisma.user.create({
      data: {
        fullName: "Drive HTTP Tester",
        username: `drive_http_${unique}`,
        email: `drive_http_${unique}@test.com`,
      },
    });
    accessToken = generateAccessToken({ id: user.id, role: "MEMBER" });

    pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
    pngBytes = await sharp({
      create: {
        width: 80,
        height: 80,
        channels: 4,
        background: { r: 26, g: 115, b: 232, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://127.0.0.1:${addr.port}/api`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });

    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.driveActivity.deleteMany({ where: { userId: user.id } });
    await prisma.driveRecentItem.deleteMany({ where: { userId: user.id } });
    await prisma.driveFileVersion.deleteMany({ where: { uploadedBy: user.id } });
    await prisma.driveFile.deleteMany({ where: { ownerId: user.id } });
    await prisma.driveFolder.deleteMany({ where: { ownerId: user.id } });
    await prisma.fileAsset.deleteMany({ where: { uploadedBy: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  });

  it("should upload PDF and PNG via POST /drive/upload", async () => {
    const form = new FormData();
    form.append(
      "files",
      new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
      "sample.pdf",
    );
    form.append(
      "files",
      new Blob([new Uint8Array(pngBytes)], { type: "image/png" }),
      "photo.png",
    );

    const res = await fetch(`${baseUrl}/drive/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    assert.strictEqual(res.status, 201);
    const body = (await res.json()) as { success: boolean; data: Array<{ id: string; name: string }> };
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 2);

    uploadedPdfId = body.data[0].id;
    uploadedImageId = body.data[1].id;
  });

  it("should reject unauthenticated stream and download requests with 401", async () => {
    const streamRes = await fetch(`${baseUrl}/drive/files/${uploadedPdfId}/stream`);
    assert.strictEqual(streamRes.status, 401);

    const downloadRes = await fetch(`${baseUrl}/drive/files/${uploadedPdfId}/download`);
    assert.strictEqual(downloadRes.status, 401);
  });

  it("should stream PDF preview with auth, CORS, CORP, and exact bytes", async () => {
    const res = await fetch(`${baseUrl}/drive/files/${uploadedPdfId}/stream`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Origin: allowedOrigin,
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("content-type"), "application/pdf");
    assert.strictEqual(res.headers.get("cross-origin-resource-policy"), "cross-origin");
    assert.strictEqual(res.headers.get("access-control-allow-origin"), allowedOrigin);
    assert.match(res.headers.get("content-disposition") || "", /inline/);

    const buf = Buffer.from(await res.arrayBuffer());
    assert.deepStrictEqual(buf, pdfBytes);
  });

  it("should download uploaded PDF with attachment Content-Disposition and exposed header", async () => {
    const res = await fetch(`${baseUrl}/drive/files/${uploadedPdfId}/download`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Origin: allowedOrigin,
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("content-type"), "application/pdf");
    assert.match(res.headers.get("content-disposition") || "", /attachment; filename="sample\.pdf"/);
    assert.match(res.headers.get("access-control-expose-headers") || "", /Content-Disposition/i);

    const buf = Buffer.from(await res.arrayBuffer());
    assert.deepStrictEqual(buf, pdfBytes);
  });

  it("should return webp thumbnail for authenticated image request", async () => {
    const res = await fetch(`${baseUrl}/drive/files/${uploadedImageId}/thumbnail?width=40&height=40`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Origin: allowedOrigin,
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("content-type"), "image/webp");
    const buf = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buf).metadata();
    assert.strictEqual(meta.format, "webp");
    assert.strictEqual(meta.width, 40);
    assert.strictEqual(meta.height, 40);
  });
});
