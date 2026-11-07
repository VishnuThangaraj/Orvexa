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
};

export default env;
