import React, { useState } from "react";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-[#0b57d0] text-white",
  "bg-[#1a73e8] text-white",
  "bg-[#1e8e3e] text-white",
  "bg-[#d93025] text-white",
  "bg-[#e37400] text-white",
  "bg-[#8430ce] text-white",
  "bg-[#007b83] text-white",
];

function getInitials(name?: string | null, fallback?: string | null): string {
  const clean = (name || fallback || "U").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function getColorClass(seed?: string | null): string {
  const str = seed || "orvexa";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  username?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
  "2xl": "w-24 h-24 text-3xl",
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  username,
  size = "md",
  className,
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = Boolean(src && failedSrc === src);

  const initials = getInitials(name, username);
  const colorClass = getColorClass(username || name);

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden shrink-0 flex items-center justify-center font-medium select-none",
        SIZE_CLASSES[size],
        (!src || hasError) && colorClass,
        className,
      )}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={name || username || "Profile"}
          onError={() => setFailedSrc(src)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default UserAvatar;
