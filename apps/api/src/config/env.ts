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

  // JWT
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: required("JWT_EXPIRES_IN"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRES_IN: required("JWT_REFRESH_EXPIRES_IN"),

  // Security
  DUMMY_PASSWORD_HASH:
    process.env.DUMMY_PASSWORD_HASH ||
    "$argon2id$v=19$m=19456,t=2,p=1$NtNKrW3kupAyV35Jwz7Eqw$/1xEcYxQL0ejfjwA4Qjn2HsoEJ7e4Y8rJSRlUYaqv6k",
};

export default env;
