import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Readable, pipeline } from "node:stream";
import { promisify } from "node:util";
import AppError from "../../common/errors/AppError.js";
import type {
  IStorageProvider,
  StorageGetOptions,
  StorageGetResult,
  StoragePutResult,
  StorageStats,
} from "./storage.types.js";

const streamPipeline = promisify(pipeline);

export class LocalStorageProvider implements IStorageProvider {
  private readonly baseDir: string;
  private readonly chunkDir: string;

  constructor(baseDir?: string, chunkDir?: string) {
    this.baseDir = path.resolve(
      baseDir ||
        process.env.STORAGE_LOCAL_DIR ||
        path.join(process.cwd(), "storage", "blobs"),
    );
    this.chunkDir = path.resolve(
      chunkDir ||
        process.env.STORAGE_CHUNK_DIR ||
        path.join(process.cwd(), "storage", "chunks"),
    );
  }

  private async ensureInitialized(): Promise<void> {
    await fsp.mkdir(this.baseDir, { recursive: true });
    await fsp.mkdir(this.chunkDir, { recursive: true });
  }

  /**
   * Resolve and validate that a storage key does not escape baseDir (prevents path traversal / zip slip).
   */
  private resolveSafePath(key: string, base: string = this.baseDir): string {
    const normalizedBase = path.resolve(base);
    // Strip leading slashes and normalize
    const cleanKey = key.replace(/^[/\\]+/, "");
    const resolved = path.resolve(normalizedBase, cleanKey);
    const relative = path.relative(normalizedBase, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative) || relative === "") {
      throw new AppError("Invalid storage path: directory traversal attempt rejected", 400);
    }
    return resolved;
  }

  async putStream(
    key: string,
    stream: Readable,
    options: { mimeType?: string } = {},
  ): Promise<StoragePutResult> {
    await this.ensureInitialized();
    const targetPath = this.resolveSafePath(key);
    await fsp.mkdir(path.dirname(targetPath), { recursive: true });

    const hash = crypto.createHash("sha256");
    let size = 0;

    const outStream = fs.createWriteStream(targetPath);

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        hash.update(chunk);
        size += chunk.length;
      });

      stream.on("error", (err) => {
        outStream.destroy(err);
        reject(err);
      });

      outStream.on("error", reject);
      outStream.on("finish", () => {
        resolve({
          key,
          size,
          sha256: hash.digest("hex"),
          mimeType: options.mimeType,
          absolutePath: targetPath,
        });
      });

      stream.pipe(outStream);
    });
  }

  async putBuffer(
    key: string,
    buffer: Buffer,
    options: { mimeType?: string } = {},
  ): Promise<StoragePutResult> {
    await this.ensureInitialized();
    const targetPath = this.resolveSafePath(key);
    await fsp.mkdir(path.dirname(targetPath), { recursive: true });

    await fsp.writeFile(targetPath, buffer);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
      key,
      size: buffer.length,
      sha256: hash,
      mimeType: options.mimeType,
      absolutePath: targetPath,
    };
  }

  async getStream(
    key: string,
    options: StorageGetOptions = {},
  ): Promise<StorageGetResult> {
    const targetPath = this.resolveSafePath(key);

    try {
      const stats = await fsp.stat(targetPath);
      const totalLength = stats.size;

      let start = options.start;
      let end = options.end;

      if (start !== undefined && end === undefined) {
        end = totalLength - 1;
      } else if (start === undefined && end !== undefined) {
        start = totalLength - end;
        end = totalLength - 1;
      }

      if (start !== undefined && end !== undefined) {
        if (start < 0 || end >= totalLength || start > end) {
          throw new AppError("Requested range not satisfiable", 416);
        }
        const stream = fs.createReadStream(targetPath, { start, end });
        const contentLength = end - start + 1;
        return {
          stream,
          contentLength,
          totalLength,
        };
      }

      const stream = fs.createReadStream(targetPath);
      return {
        stream,
        contentLength: totalLength,
        totalLength,
      };
    } catch (err: any) {
      if (err.code === "ENOENT") {
        throw new AppError("File not found in storage", 404);
      }
      throw err;
    }
  }

  async getBuffer(key: string): Promise<Buffer> {
    const targetPath = this.resolveSafePath(key);
    try {
      return await fsp.readFile(targetPath);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        throw new AppError("File not found in storage", 404);
      }
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    const targetPath = this.resolveSafePath(key);
    try {
      await fsp.unlink(targetPath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const targetPath = this.resolveSafePath(key);
    try {
      await fsp.access(targetPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getStats(key: string): Promise<StorageStats> {
    const targetPath = this.resolveSafePath(key);
    try {
      const stats = await fsp.stat(targetPath);
      return {
        size: stats.size,
        lastModified: stats.mtime,
      };
    } catch (err: any) {
      if (err.code === "ENOENT") {
        throw new AppError("File not found in storage", 404);
      }
      throw err;
    }
  }

  async saveChunk(
    chunkSessionId: string,
    chunkIndex: number,
    buffer: Buffer,
  ): Promise<void> {
    await this.ensureInitialized();
    const sessionDir = this.resolveSafePath(chunkSessionId, this.chunkDir);
    await fsp.mkdir(sessionDir, { recursive: true });

    const chunkFileName = `chunk_${String(chunkIndex).padStart(6, "0")}.part`;
    const chunkPath = path.join(sessionDir, chunkFileName);
    await fsp.writeFile(chunkPath, buffer);
  }

  async stitchChunks(
    chunkSessionId: string,
    totalChunks: number,
    finalKey: string,
    options: { mimeType?: string } = {},
  ): Promise<StoragePutResult> {
    await this.ensureInitialized();
    const sessionDir = this.resolveSafePath(chunkSessionId, this.chunkDir);
    const targetPath = this.resolveSafePath(finalKey);
    await fsp.mkdir(path.dirname(targetPath), { recursive: true });

    const writeStream = fs.createWriteStream(targetPath);
    const hash = crypto.createHash("sha256");
    let totalBytes = 0;

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkFileName = `chunk_${String(i).padStart(6, "0")}.part`;
        const chunkPath = path.join(sessionDir, chunkFileName);

        try {
          const chunkBuf = await fsp.readFile(chunkPath);
          hash.update(chunkBuf);
          totalBytes += chunkBuf.length;

          const canWrite = writeStream.write(chunkBuf);
          if (!canWrite) {
            await new Promise<void>((res) => writeStream.once("drain", () => res()));
          }
        } catch (err: any) {
          if (err.code === "ENOENT") {
            throw new AppError(`Missing chunk ${i} for session ${chunkSessionId}`, 400);
          }
          throw err;
        }
      }

      await new Promise<void>((resolve, reject) => {
        writeStream.end(() => resolve());
        writeStream.on("error", reject);
      });

      // Cleanup chunks after stitching
      await this.cleanupChunks(chunkSessionId);

      return {
        key: finalKey,
        size: totalBytes,
        sha256: hash.digest("hex"),
        mimeType: options.mimeType,
        absolutePath: targetPath,
      };
    } catch (err) {
      writeStream.destroy();
      try {
        await fsp.unlink(targetPath);
      } catch {
        // ignore
      }
      throw err;
    }
  }

  async cleanupChunks(chunkSessionId: string): Promise<void> {
    const sessionDir = this.resolveSafePath(chunkSessionId, this.chunkDir);
    try {
      await fsp.rm(sessionDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
