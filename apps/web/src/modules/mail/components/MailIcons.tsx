import React from "react";
import { cn } from "@/lib/utils";

export interface MailIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Material Design Edit / Pen icon matching Gmail Compose button
 */
export const ComposePencilIcon: React.FC<MailIconProps> = ({
  size = 20,
  className = "",
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={cn("shrink-0", className)}
    aria-hidden="true"
    {...props}
  >
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

/**
 * Material Design filled Inbox icon for active Inbox navigation state
 */
export const InboxFilledIcon: React.FC<MailIconProps> = ({
  size = 20,
  className = "",
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={cn("shrink-0", className)}
    aria-hidden="true"
    {...props}
  >
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2H19v3zm0-5h-4.99c0 1.1-.9 2-2 2s-2-.9-2-2H5V5h14v9z" />
  </svg>
);
