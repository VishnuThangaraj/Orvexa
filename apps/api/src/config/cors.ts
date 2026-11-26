import { type CorsOptions } from "cors";
import env from "./env.js";

const buildAllowedOrigins = (): string[] => {
  const origins = env.CLIENT_ORIGIN.split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  for (const host of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    if (host) {
      origins.push(
        `https://${host.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`,
      );
    }
  }

  return Array.from(new Set(origins));
};

const allowedOrigins = buildAllowedOrigins();

console.log(`CORS configured for Client Origins >> ${allowedOrigins.join(", ")}`);

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    const normalizedOrigin = origin?.replace(/\/+$/, "");
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
};

export default corsOptions;
