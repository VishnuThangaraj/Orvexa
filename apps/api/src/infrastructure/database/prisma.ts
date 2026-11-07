import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import env from "../../config/env.js";
import { PrismaClient } from "../../generated/prisma/client.js";

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("[DATABASE] Unexpected pg pool error:", err);
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

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
