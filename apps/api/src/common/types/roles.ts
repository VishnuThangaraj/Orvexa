export const ROLES = ["ADMIN", "MEMBER"] as const;

export type Role = (typeof ROLES)[number];
