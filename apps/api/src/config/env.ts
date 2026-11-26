import dotenv from "dotenv";

dotenv.config();

const optional = (name: string, fallback = ""): string => {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
};

const defaultClientOrigin = (): string => {
  const explicit = optional("CLIENT_ORIGIN").trim();
  if (explicit) return explicit;

  const vercelProdUrl = optional("VERCEL_PROJECT_PRODUCTION_URL").trim();
  if (vercelProdUrl) return `https://${vercelProdUrl}`;

  const vercelUrl = optional("VERCEL_URL").trim();
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:5155";
};

const env = {
  PORT: Number(process.env.PORT) || 6970,
  NODE_ENV: process.env.NODE_ENV || "production",

  PROJECT_VERSION: optional("PROJECT_VERSION", "1.0.0"),

  CLIENT_ORIGIN: defaultClientOrigin(),

  DATABASE_URL:
    optional("DATABASE_URL").trim() || optional("CLOUD_DATABASE_URL").trim(),
  CLOUD_DATABASE_URL:
    optional("CLOUD_DATABASE_URL").trim() || optional("DATABASE_URL").trim(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: optional("CLOUDINARY_CLOUD_NAME").trim(),
  CLOUDINARY_API_KEY: optional("CLOUDINARY_API_KEY").trim(),
  CLOUDINARY_API_SECRET: optional("CLOUDINARY_API_SECRET").trim(),

  // Admin (used by seed scripts & tests)
  ADMIN_NAME: optional("ADMIN_NAME", "Vishnu Thangaraj"),
  ADMIN_EMAIL: optional("ADMIN_EMAIL").trim(),
  ADMIN_PASSWORD: optional("ADMIN_PASSWORD"),
  ADMIN_USERNAME: optional("ADMIN_USERNAME").trim(),

  // JWT
  JWT_SECRET: optional("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "15m"),
  JWT_REFRESH_SECRET: optional("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRES_IN: optional("JWT_REFRESH_EXPIRES_IN", "7d"),

  // Security
  DUMMY_PASSWORD_HASH:
    optional("DUMMY_PASSWORD_HASH") ||
    "$argon2id$v=19$m=19456,t=2,p=1$NtNKrW3kupAyV35Jwz7Eqw$/1xEcYxQL0ejfjwA4Qjn2HsoEJ7e4Y8rJSRlUYaqv6k",

  // LiveKit Video Meetings
  LIVEKIT_URL: optional("LIVEKIT_URL", "ws://localhost:7880"),
  LIVEKIT_API_KEY: optional("LIVEKIT_API_KEY", "devkey"),
  LIVEKIT_API_SECRET: optional("LIVEKIT_API_SECRET", "secret"),
  LIVEKIT_WEBHOOK_SECRET:
    optional("LIVEKIT_WEBHOOK_SECRET") ||
    optional("LIVEKIT_API_SECRET") ||
    "secret",
};

export default env;
