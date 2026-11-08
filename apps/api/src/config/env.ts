import dotenv from "dotenv";

dotenv.config();

const required = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing Environment Vairable : ${name}`);
  }

  return value;
};

const env = {
  PORT: Number(process.env.PORT) || 6970,

  PROJECT_VERSION: required("PROJECT_VERSION"),

  CLIENT_ORIGIN: required("CLIENT_ORIGIN"),

  DATABASE_URL: required("DATABASE_URL"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),

  // Admin
  ADMIN_NAME: process.env.ADMIN_NAME || "Vishnu Thangaraj",
  ADMIN_EMAIL: required("ADMIN_EMAIL"),
  ADMIN_PASSWORD: required("ADMIN_PASSWORD"),
};

export default env;
