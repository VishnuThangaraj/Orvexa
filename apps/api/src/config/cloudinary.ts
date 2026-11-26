import env from "../config/env.js";
import { v2 as cloudinary } from "cloudinary";

export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    "[CLOUDINARY] Credentials not configured; Cloudinary uploads are disabled.",
  );
}

export default cloudinary;
