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

  console.log(
    `[SEED] Admin User seeded successfully: ${admin.email} (ID: ${admin.id})`,
  );
  return admin;
};

export const seedMembers = async () => {
  const defaultPassword = "orvexa@123";
  const hashedPassword = await hashPassword(defaultPassword);

  const members = [
    {
      fullName: "Vignesh",
      email: "vignesh@orvexa.com",
      gender: "male",
      phone: "+919876543210",
      dob: new Date("1998-06-15"),
      address: "Chennai, Tamil Nadu, India",
    },
    {
      fullName: "Thilakeshwaran",
      email: "thilakeshwaran@orvexa.com",
      gender: "male",
      phone: "+919876543211",
      dob: new Date("1997-11-20"),
      address: "Coimbatore, Tamil Nadu, India",
    },
  ];

  const seededMembers = [];

  for (const member of members) {
    const seeded = await prisma.user.upsert({
      where: {
        email: member.email,
      },
      update: {
        fullName: member.fullName,
        gender: member.gender,
        phone: member.phone,
        dob: member.dob,
        address: member.address,
        role: "MEMBER",
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
        fullName: member.fullName,
        email: member.email,
        gender: member.gender,
        phone: member.phone,
        dob: member.dob,
        address: member.address,
        role: "MEMBER",
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
            timezone: "Asia/Kolkata",
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        gender: true,
        isActive: true,
      },
    });

    console.log(
      `[SEED] Member seeded successfully: ${seeded.fullName} (${seeded.email}) [ID: ${seeded.id}]`,
    );
    seededMembers.push(seeded);
  }

  return seededMembers;
};

export const seedMember = seedMembers;
