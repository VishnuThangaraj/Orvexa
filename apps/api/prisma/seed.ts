import { disconnectDatabase } from "../src/config/prisma.js";
import { seedAdmin, seedMembers } from "./seeds/user.seed.js";
import { seedMails } from "./seeds/mail.seed.js";

const main = async () => {
  console.log("Starting database seeding...");
  const admin = await seedAdmin();
  const members = await seedMembers();
  await seedMails([admin, ...members]);
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
