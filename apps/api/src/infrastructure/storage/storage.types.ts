import type { Readable } from "node:stream";

export interface StoragePutResult {
  key: string;
  size: number;
  sha256: string;
  mimeType?: string;
  absolutePath?: string;
}

export interface StorageGetOptions {
  start?: number;
  end?: number;
}

export interface StorageGetResult {
  stream: Readable;
  contentLength: number;
  totalLength: number;
  mimeType?: string;
}

export interface StorageStats {
  size: number;
  lastModified: Date;
}

export interface IStorageProvider {
  /**
   * Save a readable stream into storage under a unique key.
   */
  putStream(
    key: string,
    stream: Readable,
    options?: { mimeType?: string },
  ): Promise<StoragePutResult>;

  /**
   * Save a buffer into storage under a unique key.
   */
  putBuffer(
    key: string,
    buffer: Buffer,
    options?: { mimeType?: string },
  ): Promise<StoragePutResult>;

  /**
   * Read a stream from storage, supporting optional HTTP byte range.
   */
  getStream(
    key: string,
    options?: StorageGetOptions,
  ): Promise<StorageGetResult>;

  /**
   * Read the full file as a Buffer into memory.
   */
  getBuffer(key: string): Promise<Buffer>;

  /**
   * Delete a stored file by key.
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists in storage.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata/stats.
   */
  getStats(key: string): Promise<StorageStats>;

  /**
   * Append or stage a chunk for a resumable upload session.
   */
  saveChunk(
    chunkSessionId: string,
    chunkIndex: number,
    buffer: Buffer,
  ): Promise<void>;

  /**
   * Assemble all chunks into the final stored file.
   */
  stitchChunks(
    chunkSessionId: string,
    totalChunks: number,
    finalKey: string,
    options?: { mimeType?: string },
  ): Promise<StoragePutResult>;

  /**
   * Delete all staged chunks for a session (abort or post-complete).
   */
  cleanupChunks(chunkSessionId: string): Promise<void>;
}
