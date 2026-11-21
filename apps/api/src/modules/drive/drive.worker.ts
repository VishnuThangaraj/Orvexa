import { driveService } from "./drive.service.js";

let purgeIntervalTimer: NodeJS.Timeout | null = null;

/**
 * Executes a single trash auto-purge pass.
 */
export const runTrashPurgeJob = async (retentionDays?: number): Promise<{
  purgedFiles: number;
  purgedFolders: number;
}> => {
  const days = retentionDays ?? (Number(process.env.TRASH_RETENTION_DAYS) || 30);
  try {
    const result = await driveService.purgeExpiredTrash(days);
    if (result.purgedFiles > 0 || result.purgedFolders > 0) {
      console.log(
        `[TRASH PURGE] Cleaned up ${result.purgedFiles} file(s) and ${result.purgedFolders} folder(s) trashed over ${days} days ago.`,
      );
    }
    return result;
  } catch (error) {
    console.error("[TRASH PURGE ERROR] Failed to purge expired trash items:", error);
    return { purgedFiles: 0, purgedFolders: 0 };
  }
};

/**
 * Starts the recurring scheduled trash purge background worker.
 */
export const startTrashPurgeWorker = (
  intervalMs = Number(process.env.TRASH_PURGE_INTERVAL_MS) || 24 * 60 * 60 * 1000,
  retentionDays = Number(process.env.TRASH_RETENTION_DAYS) || 30,
) => {
  if (purgeIntervalTimer) {
    clearInterval(purgeIntervalTimer);
  }

  // Run initial check after 30 seconds
  setTimeout(() => {
    runTrashPurgeJob(retentionDays).catch(() => {});
  }, 30000);

  // Set recurring interval
  purgeIntervalTimer = setInterval(() => {
    runTrashPurgeJob(retentionDays).catch(() => {});
  }, intervalMs);

  // Unref so worker timer doesn't prevent Node process from exiting
  purgeIntervalTimer.unref();

  console.log(
    `[TRASH WORKER] Scheduled auto-purge every ${Math.round(intervalMs / 3600000)}h (retention: ${retentionDays} days).`,
  );
};

/**
 * Stops the recurring worker (for graceful shutdown or test teardown).
 */
export const stopTrashPurgeWorker = () => {
  if (purgeIntervalTimer) {
    clearInterval(purgeIntervalTimer);
    purgeIntervalTimer = null;
  }
};
