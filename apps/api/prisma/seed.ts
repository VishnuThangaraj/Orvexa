import { disconnectDatabase } from "../src/config/prisma.js";
import { seedAdmin, seedMembers } from "./seeds/user.seed.js";

const main = async () => {
  console.log("Starting database seeding...");
  await seedAdmin();
  await seedMembers();
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
