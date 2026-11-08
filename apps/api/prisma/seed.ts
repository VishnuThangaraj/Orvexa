import { disconnectDatabase } from "../src/config/prisma.js";
import { seedAdmin } from "./seeds/user.seed.js";

const main = async () => {
  console.log("Starting database seeding...");
  await seedAdmin();
  console.log("Database seeding completed.");
};

main()
  .catch((error) => {
    console.error("Seeding Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
