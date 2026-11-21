import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fsp from "node:fs/promises";
import { Readable } from "node:stream";
import { LocalStorageProvider } from "../../src/infrastructure/storage/local.storage.js";
import AppError from "../../src/common/errors/AppError.js";

describe("Task 1.2: LocalStorageProvider Unit Tests", () => {
  const testBaseDir = path.join(process.cwd(), "storage", "test-blobs");
  const testChunkDir = path.join(process.cwd(), "storage", "test-chunks");
  const storage = new LocalStorageProvider(testBaseDir, testChunkDir);

  after(async () => {
    await fsp.rm(testBaseDir, { recursive: true, force: true });
    await fsp.rm(testChunkDir, { recursive: true, force: true });
  });

  it("should store and retrieve buffer with exact SHA-256", async () => {
    const content = Buffer.from("Hello Orvexa Drive Storage Test!");
    const key = "test/subfolder/testfile.txt";

    const putRes = await storage.putBuffer(key, content, { mimeType: "text/plain" });
    assert.equal(putRes.key, key);
    assert.equal(putRes.size, content.length);
    assert.ok(putRes.sha256.length === 64);

    const exists = await storage.exists(key);
    assert.equal(exists, true);

    const retrieved = await storage.getBuffer(key);
    assert.deepEqual(retrieved, content);

    const stats = await storage.getStats(key);
    assert.equal(stats.size, content.length);
  });

  it("should stream data to storage and read it back", async () => {
    const rawData = "Streaming data test payload 1234567890";
    const readStream = Readable.from(Buffer.from(rawData));
    const key = "test/stream-file.txt";

    const putRes = await storage.putStream(key, readStream);
    assert.equal(putRes.size, Buffer.byteLength(rawData));

    const getRes = await storage.getStream(key);
    assert.equal(getRes.totalLength, Buffer.byteLength(rawData));
    assert.equal(getRes.contentLength, Buffer.byteLength(rawData));

    const chunks: Buffer[] = [];
    for await (const chunk of getRes.stream) {
      chunks.push(chunk as Buffer);
    }
    const combined = Buffer.concat(chunks).toString("utf-8");
    assert.equal(combined, rawData);
  });

  it("should support HTTP byte range requests", async () => {
    const data = "0123456789ABCDEF"; // 16 bytes
    const key = "test/range-file.bin";
    await storage.putBuffer(key, Buffer.from(data));

    // Request bytes 4-9 ("456789") -> 6 bytes
    const rangeRes = await storage.getStream(key, { start: 4, end: 9 });
    assert.equal(rangeRes.contentLength, 6);
    assert.equal(rangeRes.totalLength, 16);

    const chunks: Buffer[] = [];
    for await (const chunk of rangeRes.stream) {
      chunks.push(chunk as Buffer);
    }
    assert.equal(Buffer.concat(chunks).toString("utf-8"), "456789");
  });

  it("should reject invalid range requests with 416", async () => {
    const key = "test/range-file.bin";
    await assert.rejects(
      async () => {
        await storage.getStream(key, { start: 20, end: 30 });
      },
      (err: any) => err instanceof AppError && err.statusCode === 416,
    );
  });

  it("should prevent directory traversal attacks", async () => {
    const maliciousKey = "../../etc/passwd";
    await assert.rejects(
      async () => {
        await storage.putBuffer(maliciousKey, Buffer.from("malicious"));
      },
      (err: any) => err instanceof AppError && err.statusCode === 400,
    );
  });

  it("should save and stitch chunks sequentially, then cleanup chunk session", async () => {
    const sessionId = "upload-session-test-uuid";
    const part1 = Buffer.from("ChunkPartOne_");
    const part2 = Buffer.from("ChunkPartTwo_");
    const part3 = Buffer.from("ChunkPartThree!");

    await storage.saveChunk(sessionId, 0, part1);
    await storage.saveChunk(sessionId, 1, part2);
    await storage.saveChunk(sessionId, 2, part3);

    const finalKey = "stitched/assembled.txt";
    const result = await storage.stitchChunks(sessionId, 3, finalKey, {
      mimeType: "text/plain",
    });

    assert.equal(result.size, part1.length + part2.length + part3.length);

    const assembledBuf = await storage.getBuffer(finalKey);
    assert.equal(assembledBuf.toString("utf-8"), "ChunkPartOne_ChunkPartTwo_ChunkPartThree!");

    // Verify temp chunks directory cleaned up
    const sessionDir = path.join(testChunkDir, sessionId);
    const dirExists = await fsp.access(sessionDir).then(() => true).catch(() => false);
    assert.equal(dirExists, false);
  });

  it("should delete stored file cleanly", async () => {
    const key = "test/to-delete.txt";
    await storage.putBuffer(key, Buffer.from("Delete me"));
    assert.equal(await storage.exists(key), true);

    await storage.delete(key);
    assert.equal(await storage.exists(key), false);
  });
});
