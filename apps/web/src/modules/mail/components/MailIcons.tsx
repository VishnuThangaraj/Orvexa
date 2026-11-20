import React from "react";
import { cn } from "@/lib/utils";

export interface MailIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Material Design Edit / Pen icon matching Orvexa Mail Compose button
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

/**
 * Official Orvexa Mail Envelope Logo
 */
export const OrvexaMailLogo: React.FC<MailIconProps> = ({
  size = 28,
  className = "",
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={cn("shrink-0", className)}
    aria-hidden="true"
    {...props}
  >
    <path
      fill="#4285F4"
      d="M2 7.7V18a2 2 0 0 0 2 2h3V9.5L2 7.7z"
    />
    <path
      fill="#34A853"
      d="M22 7.7L17 9.5V20h3a2 2 0 0 0 2-2V7.7z"
    />
    <path
      fill="#EA4335"
      d="M12 14.5L2.3 7.6A2 2 0 0 1 4 6h16a2 2 0 0 1 1.7 1.6L12 14.5z"
    />
    <path
      fill="#FBBC05"
      d="M2 7.7l5 3.5V6L3.7 4.7A2 2 0 0 0 2 6.5v1.2z"
    />
    <path
      fill="#C5221F"
      d="M22 7.7l-5 3.5V6l3.3-1.3A2 2 0 0 1 22 6.5v1.2z"
    />
  </svg>
);

/**
 * Orvexa Calendar Companion Icon (31)
 */
export const OrvexaCalendarIcon: React.FC<MailIconProps> = ({
  size = 20,
  className = "",
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={cn("shrink-0", className)}
    {...props}
  >
    <rect
      x="2.5"
      y="3.5"
      width="19"
      height="17.5"
      rx="3.5"
      fill="#ffffff"
      stroke="#4285F4"
      strokeWidth="1.6"
    />
    <path d="M2.5 8.5h19" stroke="#4285F4" strokeWidth="1.6" />
    <path
      d="M7 2v3M17 2v3"
      stroke="#4285F4"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="700"
      fill="#4285F4"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      31
    </text>
  </svg>
);

/**
 * Orvexa Keep Companion Icon (Lightbulb)
 */
export const OrvexaKeepIcon: React.FC<MailIconProps> = ({
  size = 20,
  className = "",
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={cn("shrink-0", className)}
    {...props}
  >
    <path
      d="M9 20h6m-4-2.5h2m-6-5a6 6 0 1 1 10 0c-.8 1.1-1.5 2.5-1.5 3.5H8.5c0-1-.7-2.4-1.5-3.5z"
      fill="#FBBC04"
      stroke="#F29900"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Orvexa Tasks Companion Icon (Checkmark)
 */
export const OrvexaTasksIcon: React.FC<MailIconProps> = ({
  size = 20,
  className = "",
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={cn("shrink-0", className)}
    {...props}
  >
    <circle cx="12" cy="12" r="9.5" fill="#1a73e8" />
    <path
      d="M7.8 12.2l2.8 2.8 5.6-5.8"
      stroke="#ffffff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

/**
 * Orvexa Contacts Companion Icon (Avatar)
 */
export const OrvexaContactsIcon: React.FC<MailIconProps> = ({
  size = 20,
  className = "",
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={cn("shrink-0", className)}
    {...props}
  >
    <circle cx="12" cy="12" r="9.5" fill="#1a73e8" />
    <circle cx="12" cy="9.5" r="3.2" fill="#ffffff" />
    <path
      d="M6.2 18c1.3-2.6 3.6-3.8 5.8-3.8s4.5 1.2 5.8 3.8"
      fill="#ffffff"
    />
  </svg>
);

/**
 * Orvexa Search Bar Tune / Sliders Filter Icon
 */
export const SlidersTuneIcon: React.FC<MailIconProps> = ({
  size = 18,
  className = "",
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={cn("shrink-0", className)}
    {...props}
  >
    <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
  </svg>
);

export const GmailLogo = OrvexaMailLogo;

