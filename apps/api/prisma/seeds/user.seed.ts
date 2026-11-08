import env from "../../src/config/env.js";
import prisma from "../../src/config/prisma.js";
import { hashPassword } from "../../src/common/utils/password.js";

export const seedAdmin = async () => {
  const name = env.ADMIN_NAME;
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;

  if (!email) {
    throw new Error("Admin Email is missing from environment variables!");
  }

  if (!password) {
    throw new Error("Admin Password is missing from environment variables!");
  }

  const hashedPassword = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      fullName: name,
      role: "ADMIN",
      isActive: true,
      credentials: {
        upsert: {
          create: {
            passwordHash: hashedPassword,
          },
          update: {
            passwordHash: hashedPassword,
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        },
      },
    },
    create: {
      fullName: name,
      email,
      role: "ADMIN",
      isActive: true,
      credentials: {
        create: {
          passwordHash: hashedPassword,
        },
      },
      preferences: {
        create: {
          theme: "system",
          language: "en",
          timezone: "UTC",
        },
      },
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  console.log(`[SEED] Admin User seeded successfully: ${admin.email} (ID: ${admin.id})`);
  return admin;
};
