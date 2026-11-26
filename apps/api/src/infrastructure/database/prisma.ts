import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import env from "../../config/env.js";
import { PrismaClient } from "../../generated/prisma/client.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
};

if (!env.DATABASE_URL) {
  console.warn(
    "[DATABASE] DATABASE_URL is not configured; database queries will fail until it is set.",
  );
}

const createPool = (): pg.Pool => {
  const newPool = new pg.Pool({
    connectionString: env.DATABASE_URL || undefined,
    max: process.env.VERCEL ? 5 : 10,
  });

  newPool.on("error", (err) => {
    console.error("[DATABASE] Unexpected pg pool error:", err);
  });

  return newPool;
};

const pool = globalForPrisma.pgPool ?? createPool();
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

globalForPrisma.pgPool = pool;
globalForPrisma.prisma = prisma;

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("[DATABASE] Connected successfully to PostgreSQL via Prisma.");
  } catch (error) {
    console.error("[DATABASE] Connection error:", error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    await pool.end();
    console.log("[DATABASE] Database connections closed.");
  } catch (error) {
    console.error("[DATABASE] Error disconnecting from database:", error);
    throw error;
  }
};

export default prisma;
