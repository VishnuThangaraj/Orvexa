import env from "../../src/config/env.js";
import prisma from "../../src/config/prisma.js";
import { hashPassword } from "../../src/common/utils/password.js";

export const seedAdmin = async () => {
  const name = env.ADMIN_NAME;
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;
  const username = env.ADMIN_USERNAME;

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
      username,
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
      username,
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
      username: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  console.log(
    `[SEED] Admin User seeded successfully: ${admin.username} (${admin.email}) [ID: ${admin.id}]`,
  );
  return admin;
};

export const seedMembers = async () => {
  const defaultPassword = "orvexa@123";
  const hashedPassword = await hashPassword(defaultPassword);

  const members = [
    {
      fullName: "Vignesh",
      username: "vignesh",
      email: "vignesh@gmail.com",
      gender: "male",
      phone: "+919876543210",
      dob: new Date("1998-06-15"),
      address: "Chennai, Tamil Nadu, India",
    },
    {
      fullName: "Thilakeshwaran",
      username: "thilakeshwaran",
      email: "thilakeshwaran@gmail.com",
      gender: "male",
      phone: "+919876543211",
      dob: new Date("1997-11-20"),
      address: "Coimbatore, Tamil Nadu, India",
    },
    {
      fullName: "Aravind Swaminathan",
      username: "aravind",
      email: "aravind@gmail.com",
      gender: "male",
      phone: "+919876543212",
      dob: new Date("1996-03-12"),
      address: "Madurai, Tamil Nadu, India",
    },
    {
      fullName: "Priya Raman",
      username: "priya",
      email: "priya@gmail.com",
      gender: "female",
      phone: "+919876543213",
      dob: new Date("1999-07-24"),
      address: "Bengaluru, Karnataka, India",
    },
    {
      fullName: "Karthik Rajan",
      username: "karthik",
      email: "karthik@gmail.com",
      gender: "male",
      phone: "+919876543214",
      dob: new Date("1995-09-08"),
      address: "Tiruchirappalli, Tamil Nadu, India",
    },
    {
      fullName: "Ananya Sharma",
      username: "ananya",
      email: "ananya@gmail.com",
      gender: "female",
      phone: "+919876543215",
      dob: new Date("2000-01-30"),
      address: "Hyderabad, Telangana, India",
    },
    {
      fullName: "Rahul Verma",
      username: "rahul",
      email: "rahul@gmail.com",
      gender: "male",
      phone: "+919876543216",
      dob: new Date("1994-12-05"),
      address: "Mumbai, Maharashtra, India",
    },
    {
      fullName: "Sneha Patel",
      username: "sneha",
      email: "sneha@gmail.com",
      gender: "female",
      phone: "+919876543217",
      dob: new Date("1997-04-18"),
      address: "Ahmedabad, Gujarat, India",
    },
    {
      fullName: "Deepak Kumar",
      username: "deepak",
      email: "deepak@gmail.com",
      gender: "male",
      phone: "+919876543218",
      dob: new Date("1996-08-22"),
      address: "New Delhi, Delhi, India",
    },
    {
      fullName: "Divya Krishnan",
      username: "divya",
      email: "divya@gmail.com",
      gender: "female",
      phone: "+919876543219",
      dob: new Date("1998-10-14"),
      address: "Kochi, Kerala, India",
    },
    {
      fullName: "Manoj Prabhakar",
      username: "manoj",
      email: "manoj@gmail.com",
      gender: "male",
      phone: "+919876543220",
      dob: new Date("1995-05-19"),
      address: "Salem, Tamil Nadu, India",
    },
    {
      fullName: "Pooja Sundaram",
      username: "pooja",
      email: "pooja@gmail.com",
      gender: "female",
      phone: "+919876543221",
      dob: new Date("1999-02-11"),
      address: "Tirunelveli, Tamil Nadu, India",
    },
    {
      fullName: "Suresh Raina",
      username: "suresh",
      email: "suresh@gmail.com",
      gender: "male",
      phone: "+919876543222",
      dob: new Date("1993-11-27"),
      address: "Lucknow, Uttar Pradesh, India",
    },
    {
      fullName: "Kavitha Selvan",
      username: "kavitha",
      email: "kavitha@gmail.com",
      gender: "female",
      phone: "+919876543223",
      dob: new Date("1997-08-03"),
      address: "Vellore, Tamil Nadu, India",
    },
    {
      fullName: "Rohit Menon",
      username: "rohit",
      email: "rohit@gmail.com",
      gender: "male",
      phone: "+919876543224",
      dob: new Date("1996-06-25"),
      address: "Thiruvananthapuram, Kerala, India",
    },
    {
      fullName: "Shreya Iyer",
      username: "shreya",
      email: "shreya@gmail.com",
      gender: "female",
      phone: "+919876543225",
      dob: new Date("1998-03-17"),
      address: "Pune, Maharashtra, India",
    },
    {
      fullName: "Arun Prakash",
      username: "arun",
      email: "arun@gmail.com",
      gender: "male",
      phone: "+919876543226",
      dob: new Date("1995-12-09"),
      address: "Erode, Tamil Nadu, India",
    },
    {
      fullName: "Meera Nambiar",
      username: "meera",
      email: "meera@gmail.com",
      gender: "female",
      phone: "+919876543227",
      dob: new Date("1999-09-14"),
      address: "Kozhikode, Kerala, India",
    },
    {
      fullName: "Harish Natarajan",
      username: "harish",
      email: "harish@gmail.com",
      gender: "male",
      phone: "+919876543228",
      dob: new Date("1994-07-29"),
      address: "Thanjavur, Tamil Nadu, India",
    },
    {
      fullName: "Swetha Balan",
      username: "swetha",
      email: "swetha@gmail.com",
      gender: "female",
      phone: "+919876543229",
      dob: new Date("1998-04-02"),
      address: "Kanchipuram, Tamil Nadu, India",
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
        username: member.username,
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
        username: member.username,
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
        username: true,
        fullName: true,
        email: true,
        role: true,
        gender: true,
        isActive: true,
      },
    });

    console.log(
      `[SEED] Member seeded successfully: ${seeded.fullName} (${seeded.username} / ${seeded.email}) [ID: ${seeded.id}]`,
    );
    seededMembers.push(seeded);
  }

  return seededMembers;
};

export const seedMember = seedMembers;
