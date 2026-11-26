import React, { useMemo, useState } from "react";
import {
  Camera,
  ChevronRight,
  IdCard,
  KeyRound,
  Laptop,
  Palette,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { UserAvatar } from "@/common/components/UserAvatar";
import type { User } from "@/modules/auth/types";
import type { ProfileTabId } from "../types/profile.types";
import type { EditableProfileField } from "./ProfileEditModal";

export interface ProfileHomeTabProps {
  user: User;
  onNavigateTab: (tab: ProfileTabId) => void;
  onOpenPhotoModal: () => void;
  onEditField: (field: EditableProfileField) => void;
  onOpenPasswordModal: () => void;
}

interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  keywords: string;
  action: () => void;
}

export const ProfileHomeTab: React.FC<ProfileHomeTabProps> = ({
  user,
  onNavigateTab,
  onOpenPhotoModal,
  onEditField,
  onOpenPasswordModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: "photo",
        title: "Profile picture",
        subtitle: "Add, crop, or remove your account photo",
        keywords: "photo avatar picture image camera",
        action: onOpenPhotoModal,
      },
      {
        id: "fullName",
        title: "Name",
        subtitle: user.fullName,
        keywords: "name full name display",
        action: () => onEditField("fullName"),
      },
      {
        id: "username",
        title: "Username & workspace email",
        subtitle: `@${user.username} (${user.username}@orvexa.com)`,
        keywords: "username handle alias email orvexa",
        action: () => onEditField("username"),
      },
      {
        id: "email",
        title: "Communication email",
        subtitle: user.email,
        keywords: "email contact recovery",
        action: () => onEditField("email"),
      },
      {
        id: "phone",
        title: "Phone number",
        subtitle: user.phone || "Add a phone number",
        keywords: "phone mobile contact",
        action: () => onEditField("phone"),
      },
      {
        id: "dob",
        title: "Birthday",
        subtitle: user.dob ? String(user.dob).slice(0, 10) : "Add birthday",
        keywords: "birthday dob birth date",
        action: () => onEditField("dob"),
      },
      {
        id: "password",
        title: "Change password",
        subtitle: "Update your Orvexa sign-in password",
        keywords: "password security sign in reset",
        action: onOpenPasswordModal,
      },
      {
        id: "devices",
        title: "Your devices",
        subtitle: `${user.activeSessionsCount ?? 1} active session${(user.activeSessionsCount ?? 1) === 1 ? "" : "s"}`,
        keywords: "devices sessions sign out security",
        action: () => onNavigateTab("security"),
      },
      {
        id: "theme",
        title: "Theme & appearance",
        subtitle: "Switch between Light, Dark, and System themes",
        keywords: "theme dark light appearance mode",
        action: () => onNavigateTab("preferences"),
      },
      {
        id: "timezone",
        title: "Language & timezone",
        subtitle: user.preferences?.timezone || "UTC",
        keywords: "language timezone region notifications",
        action: () => onNavigateTab("preferences"),
      },
    ],
    [user, onOpenPhotoModal, onEditField, onOpenPasswordModal, onNavigateTab],
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return quickActions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.includes(q),
    );
  }, [searchQuery, quickActions]);

  const workspaceEmail = `${user.username}@orvexa.com`;

  return (
    <div className="space-y-6">
      {/* Centered Google Account Hero */}
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        <button
          type="button"
          onClick={onOpenPhotoModal}
          className="relative group cursor-pointer mb-4 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b57d0] dark:focus-visible:ring-[#a8c7fa]"
          title="Change profile picture"
          aria-label="Change profile picture"
        >
          <UserAvatar
            src={user.profileImage?.secureUrl}
            name={user.fullName}
            username={user.username}
            size="2xl"
            className="ring-4 ring-white dark:ring-[#1e1f20] shadow-md transition-transform group-hover:scale-[1.02]"
          />
          <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-[#282a2c] border border-[#dadce0] dark:border-[#3c4043] flex items-center justify-center shadow-sm text-[#1f1f1f] dark:text-[#e3e3e3] group-hover:bg-[#f0f4f9] dark:group-hover:bg-[#333537] transition-colors">
            <Camera size={15} />
          </span>
        </button>

        <h1 className="text-2xl sm:text-[28px] font-normal text-[#1f1f1f] dark:text-[#e3e3e3] tracking-tight">
          Welcome, {user.fullName}
        </h1>
        <p className="text-sm text-[#444746] dark:text-[#c4c7c5] mt-1">
          {workspaceEmail} • Manage your info, security, and preferences across Orvexa
        </p>

        {/* Google Account Search Bar */}
        <div className="relative w-full max-w-xl mt-5">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444746] dark:text-[#c4c7c5] pointer-events-none"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Orvexa Account (e.g. photo, username, password, theme)"
            className="w-full pl-11 pr-5 py-3 rounded-full bg-white dark:bg-[#1e1f20] text-sm text-[#1f1f1f] dark:text-[#e3e3e3] placeholder:text-[#444746]/80 dark:placeholder:text-[#c4c7c5]/70 border border-[#dadce0] dark:border-[#3c4043] focus:border-[#0b57d0] dark:focus:border-[#a8c7fa] focus:ring-2 focus:ring-[#0b57d0]/15 dark:focus:ring-[#a8c7fa]/15 outline-none shadow-2xs transition-all"
          />

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl shadow-xl py-2 z-20 text-left overflow-hidden">
              {searchResults.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    item.action();
                  }}
                  className="w-full px-5 py-2.5 flex items-center justify-between hover:bg-[#f0f4f9] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#444746] dark:text-[#c4c7c5] truncate max-w-md">
                      {item.subtitle}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-[#444746] dark:text-[#c4c7c5]"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modular Google M3 Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Info Summary Card */}
        <div className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl p-6 flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#0b57d0] dark:text-[#a8c7fa]">
                <IdCard size={15} />
                <span>Personal info</span>
              </div>
              <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                Your profile & identity
              </h2>
              <p className="text-sm text-[#444746] dark:text-[#c4c7c5]">
                Update your photo, name, username, birthday, and contact details.
              </p>
            </div>
            <UserAvatar
              src={user.profileImage?.secureUrl}
              name={user.fullName}
              username={user.username}
              size="lg"
              className="shrink-0"
            />
          </div>

          <div className="rounded-2xl bg-[#f8fafd] dark:bg-[#131314] border border-[#e1e3e1]/70 dark:border-[#333537] px-4 py-3 text-xs space-y-1.5">
            <div className="flex justify-between gap-3">
              <span className="text-[#444746] dark:text-[#c4c7c5]">Username</span>
              <span className="font-medium text-[#1f1f1f] dark:text-[#e3e3e3] truncate">
                @{user.username}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#444746] dark:text-[#c4c7c5]">Email</span>
              <span className="font-medium text-[#1f1f1f] dark:text-[#e3e3e3] truncate">
                {user.email}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-[#e1e3e1] dark:border-[#333537]">
            <button
              type="button"
              onClick={() => onNavigateTab("personal-info")}
              className="text-sm font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Manage personal info</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Security & Sign-In Summary Card */}
        <div className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl p-6 flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#137333] dark:text-[#81c995]">
                <ShieldCheck size={15} />
                <span>Security & sign-in</span>
              </div>
              <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                Your account is protected
              </h2>
              <p className="text-sm text-[#444746] dark:text-[#c4c7c5]">
                Manage your password and review devices signed into your account.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#e6f4ea] dark:bg-[#137333]/25 text-[#137333] dark:text-[#81c995] flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="rounded-2xl bg-[#f8fafd] dark:bg-[#131314] border border-[#e1e3e1]/70 dark:border-[#333537] px-4 py-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[#444746] dark:text-[#c4c7c5]">
                <Laptop size={13} />
                Active sessions
              </span>
              <span className="font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                {user.activeSessionsCount ?? 1} device
                {(user.activeSessionsCount ?? 1) === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[#444746] dark:text-[#c4c7c5]">
                <KeyRound size={13} />
                Account role
              </span>
              <span className="font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                {user.role === "ADMIN" ? "Administrator" : "Member"}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-[#e1e3e1] dark:border-[#333537]">
            <button
              type="button"
              onClick={() => onNavigateTab("security")}
              className="text-sm font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Review security & devices</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Preferences & Appearance Summary Card */}
        <div className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl p-6 flex flex-col justify-between gap-5 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#d3e3fd] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#c2e7ff] flex items-center justify-center shrink-0">
                <Palette size={22} />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0b57d0] dark:text-[#a8c7fa]">
                  <SlidersHorizontal size={14} />
                  <span>Preferences & privacy</span>
                </div>
                <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                  Customize appearance, timezone & notifications
                </h2>
                <p className="text-sm text-[#444746] dark:text-[#c4c7c5]">
                  Theme:{" "}
                  <span className="font-medium capitalize text-[#1f1f1f] dark:text-[#e3e3e3]">
                    {user.preferences?.theme || "system"}
                  </span>{" "}
                  • Timezone:{" "}
                  <span className="font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                    {user.preferences?.timezone || "UTC"}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab("preferences")}
              className="self-start sm:self-center px-5 py-2.5 rounded-full bg-[#d3e3fd] hover:bg-[#c2d9fc] text-[#041e49] dark:bg-[#004a77] dark:hover:bg-[#005a91] dark:text-[#c2e7ff] text-sm font-medium transition-colors cursor-pointer shrink-0"
            >
              Manage preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHomeTab;
