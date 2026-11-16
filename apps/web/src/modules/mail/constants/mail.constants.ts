import React from "react";
import {
  Inbox,
  Star,
  Clock,
  SendHorizontal,
  File,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { InboxFilledIcon } from "../components/MailIcons";

export type IconComponent =
  | LucideIcon
  | React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;

export interface MailMenuItem {
  id: string;
  name: string;
  icon: IconComponent;
  activeIcon?: IconComponent;
  badge?: number | string;
  badgeBold?: boolean;
}

export const MAIL_MENU: MailMenuItem[] = [
  {
    id: "inbox",
    name: "Inbox",
    icon: Inbox,
    activeIcon: InboxFilledIcon,
  },
  {
    id: "starred",
    name: "Starred",
    icon: Star,
  },
  {
    id: "snoozed",
    name: "Snoozed",
    icon: Clock,
  },
  {
    id: "sent",
    name: "Sent",
    icon: SendHorizontal,
  },
  {
    id: "drafts",
    name: "Drafts",
    icon: File,
    badge: 2,
    badgeBold: true,
  },
  {
    id: "trash",
    name: "Trash",
    icon: Trash2,
  },
];
