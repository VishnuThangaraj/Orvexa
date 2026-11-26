import { z } from "zod";

const usernameRegex = /^[a-z0-9](?:[a-z0-9._-]{0,98}[a-z0-9])?$/;

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(150, "Full name cannot exceed 150 characters")
      .optional(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "Username must be at least 2 characters")
      .max(100, "Username cannot exceed 100 characters")
      .regex(
        usernameRegex,
        "Username must start and end with a letter or number and can only include lowercase letters, numbers, dots, underscores, and hyphens",
      )
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(255, "Email cannot exceed 255 characters")
      .pipe(z.email("Invalid email format"))
      .optional(),
    phone: z
      .union([
        z
          .string()
          .trim()
          .max(20, "Phone number cannot exceed 20 characters")
          .regex(
            /^[+\d\s().-]{5,20}$/,
            "Phone number must be 5–20 characters and contain only digits or + ( ) . -",
          ),
        z.literal(""),
        z.null(),
      ])
      .transform((val) => (val === "" ? null : val))
      .optional(),
    dob: z
      .union([
        z
          .string()
          .trim()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthday must be in YYYY-MM-DD format")
          .refine((val) => {
            const parsed = new Date(`${val}T00:00:00.000Z`);
            if (Number.isNaN(parsed.getTime())) return false;
            const [y, m, d] = val.split("-").map(Number);
            if (
              parsed.getUTCFullYear() !== y ||
              parsed.getUTCMonth() + 1 !== m ||
              parsed.getUTCDate() !== d
            ) {
              return false;
            }
            const minDate = new Date("1900-01-01T00:00:00.000Z");
            return parsed >= minDate && parsed <= new Date();
          }, "Birthday must be a valid past date"),
        z.literal(""),
        z.null(),
      ])
      .transform((val) => (val === "" ? null : val))
      .optional(),
    gender: z
      .union([
        z
          .string()
          .trim()
          .min(1, "Gender cannot be empty")
          .max(30, "Gender cannot exceed 30 characters"),
        z.literal(""),
        z.null(),
      ])
      .transform((val) => (val === "" ? null : val))
      .optional(),
    address: z
      .union([
        z.string().trim().max(500, "Address cannot exceed 500 characters"),
        z.literal(""),
        z.null(),
      ])
      .transform((val) => (val === "" ? null : val))
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: "At least one profile field must be provided",
    },
  );

export const usernameAvailabilityQuerySchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Username must be at least 2 characters")
    .max(100, "Username cannot exceed 100 characters")
    .regex(
      usernameRegex,
      "Username must start and end with a letter or number and can only include lowercase letters, numbers, dots, underscores, and hyphens",
    ),
});

export const updatePreferencesSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    language: z
      .string()
      .trim()
      .min(2, "Language code must be at least 2 characters")
      .max(20, "Language code cannot exceed 20 characters")
      .optional(),
    timezone: z
      .string()
      .trim()
      .min(2, "Timezone is required")
      .max(100, "Timezone cannot exceed 100 characters")
      .refine((tz) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      }, "Invalid IANA timezone")
      .optional(),
    notificationPreferences: z
      .object({
        mail: z.boolean().optional(),
        chat: z.boolean().optional(),
        calendar: z.boolean().optional(),
        security: z.boolean().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: "At least one preference field must be provided",
    },
  );
