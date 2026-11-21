import { describe, it } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../src/infrastructure/database/prisma.js";

describe("Task 1.1: Drive Schema & Additive Tables Verification", () => {
  it("should verify DriveFolder has color and description fields", async () => {
    // Check if drive_folders table columns include color and description
    const columns: Array<{ column_name: string }> = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drive_folders' AND column_name IN ('color', 'description');
    `;
    const names = columns.map((c) => c.column_name);
    assert.ok(names.includes("color"), "color column should exist in drive_folders");
    assert.ok(names.includes("description"), "description column should exist in drive_folders");
  });

  it("should verify DriveFile has description, searchable_content, prevent_download, prevent_editor_sharing", async () => {
    const columns: Array<{ column_name: string }> = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drive_files' AND column_name IN (
        'description', 'searchable_content', 'prevent_download', 'prevent_editor_sharing'
      );
    `;
    const names = columns.map((c) => c.column_name);
    assert.ok(names.includes("description"), "description column should exist in drive_files");
    assert.ok(names.includes("searchable_content"), "searchable_content column should exist in drive_files");
    assert.ok(names.includes("prevent_download"), "prevent_download column should exist in drive_files");
    assert.ok(names.includes("prevent_editor_sharing"), "prevent_editor_sharing column should exist in drive_files");
  });

  it("should verify FileAsset has storage_backend, storage_path, and sha256", async () => {
    const columns: Array<{ column_name: string }> = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'file_assets' AND column_name IN (
        'storage_backend', 'storage_path', 'sha256'
      );
    `;
    const names = columns.map((c) => c.column_name);
    assert.ok(names.includes("storage_backend"), "storage_backend column should exist in file_assets");
    assert.ok(names.includes("storage_path"), "storage_path column should exist in file_assets");
    assert.ok(names.includes("sha256"), "sha256 column should exist in file_assets");
  });

  it("should verify new tables exist in PostgreSQL database", async () => {
    const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN (
        'drive_share_links',
        'drive_access_requests',
        'drive_activities',
        'drive_shortcuts',
        'drive_upload_sessions',
        'calendar_event_attachments'
      );
    `;
    const names = tables.map((t) => t.table_name);
    assert.ok(names.includes("drive_share_links"), "drive_share_links table must exist");
    assert.ok(names.includes("drive_access_requests"), "drive_access_requests table must exist");
    assert.ok(names.includes("drive_activities"), "drive_activities table must exist");
    assert.ok(names.includes("drive_shortcuts"), "drive_shortcuts table must exist");
    assert.ok(names.includes("drive_upload_sessions"), "drive_upload_sessions table must exist");
    assert.ok(names.includes("calendar_event_attachments"), "calendar_event_attachments table must exist");
  });
});
