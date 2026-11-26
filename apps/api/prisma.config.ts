import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url:
      process.env.DATABASE_URL ||
      process.env.CLOUD_DATABASE_URL ||
      "postgresql://localhost:5432/orvexa",
  },
});
