import React, { useState } from "react";
import { Camera, Check, ChevronRight, Copy } from "lucide-react";
import { UserAvatar } from "@/common/components/UserAvatar";
import type { User } from "@/modules/auth/types";
import type { EditableProfileField } from "./ProfileEditModal";

export interface ProfilePersonalInfoTabProps {
  user: User;
  onOpenPhotoModal: () => void;
  onEditField: (field: EditableProfileField) => void;
}

function formatBirthday(dob?: string | null): string {
  if (!dob) return "Not set";
  const datePart = String(dob).slice(0, 10);
  const parsed = new Date(`${datePart}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return datePart;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export const ProfilePersonalInfoTab: React.FC<ProfilePersonalInfoTabProps> = ({
  user,
  onOpenPhotoModal,
  onEditField,
}) => {
  const [copiedWorkspaceEmail, setCopiedWorkspaceEmail] = useState(false);

  const workspaceEmail = `${user.username}@orvexa.com`;

  const handleCopyWorkspaceEmail = async () => {
    try {
      await navigator.clipboard.writeText(workspaceEmail);
      setCopiedWorkspaceEmail(true);
      setTimeout(() => setCopiedWorkspaceEmail(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-normal text-[#1f1f1f] dark:text-[#e3e3e3] tracking-tight">
          Personal info
        </h1>
        <p className="text-sm text-[#444746] dark:text-[#c4c7c5]">
          Info about you and your preferences across Orvexa services
        </p>
      </div>

      {/* Basic Info Card */}
      <section className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl overflow-hidden">
        <div className="px-6 pt-6 pb-3">
          <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
            Basic info
          </h2>
          <p className="text-xs text-[#444746] dark:text-[#c4c7c5] mt-0.5">
            Some info may be visible to other people using Orvexa Workspace.
          </p>
        </div>

        <div className="divide-y divide-[#e1e3e1] dark:divide-[#333537]">
          {/* Profile Picture Row */}
          <button
            type="button"
            onClick={onOpenPhotoModal}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
                Profile picture
              </span>
              <span className="text-sm text-[#444746] dark:text-[#c4c7c5] truncate">
                A profile picture helps personalize your account
              </span>
            </div>

            <div className="relative shrink-0">
              <UserAvatar
                src={user.profileImage?.secureUrl}
                name={user.fullName}
                username={user.username}
                size="lg"
                className="ring-2 ring-[#e1e3e1] dark:ring-[#333537]"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#282a2c] border border-[#dadce0] dark:border-[#3c4043] flex items-center justify-center shadow-xs text-[#1f1f1f] dark:text-[#e3e3e3]">
                <Camera size={12} />
              </span>
            </div>
          </button>

          {/* Name Row */}
          <button
            type="button"
            onClick={() => onEditField("fullName")}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
                Name
              </span>
              <span className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3] truncate">
                {user.fullName}
              </span>
            </div>
            <ChevronRight
              size={18}
              className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
            />
          </button>

          {/* Username Row */}
          <button
            type="button"
            onClick={() => onEditField("username")}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
                Username
              </span>
              <div className="min-w-0">
                <span className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3] block truncate">
                  @{user.username}
                </span>
                <span className="text-xs text-[#444746] dark:text-[#c4c7c5] block truncate">
                  Workspace handle • {workspaceEmail}
                </span>
              </div>
            </div>
            <ChevronRight
              size={18}
              className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
            />
          </button>

          {/* Birthday Row */}
          <button
            type="button"
            onClick={() => onEditField("dob")}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
                Birthday
              </span>
              <span
                className={`text-sm truncate ${
                  user.dob
                    ? "text-[#1f1f1f] dark:text-[#e3e3e3]"
                    : "text-[#444746] dark:text-[#c4c7c5] italic"
                }`}
              >
                {formatBirthday(user.dob)}
              </span>
            </div>
            <ChevronRight
              size={18}
              className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
            />
          </button>

          {/* Gender Row */}
          <button
            type="button"
            onClick={() => onEditField("gender")}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
                Gender
              </span>
              <span
                className={`text-sm truncate capitalize ${
                  user.gender
                    ? "text-[#1f1f1f] dark:text-[#e3e3e3]"
                    : "text-[#444746] dark:text-[#c4c7c5] italic"
                }`}
              >
                {user.gender || "Not set"}
              </span>
            </div>
            <ChevronRight
              size={18}
              className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
            />
          </button>
        </div>
      </section>

      {/* Contact Info Card */}
      <section className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl overflow-hidden">
        <div className="px-6 pt-6 pb-3">
          <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
            Contact info
          </h2>
        </div>

        <div className="divide-y divide-[#e1e3e1] dark:divide-[#333537]">
          {/* Communication Email */}
          <button
            type="button"
            onClick={() => onEditField("email")}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
                Email
              </span>
              <span className="text-sm text-[#1f1f1f] dark:text-[#e3e3e3] truncate">
                {user.email}
              </span>
            </div>
            <ChevronRight
              size={18}
              className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
            />
          </button>

          {/* Workspace Address (synced with username) */}
          <div className="w-full px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
                Orvexa mail
              </span>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-sm text-[#1f1f1f] dark:text-[#e3e3e3] truncate">
                  {workspaceEmail}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]">
                  Workspace
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyWorkspaceEmail}
              title="Copy workspace email"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#0b57d0]/8 dark:hover:bg-[#a8c7fa]/10 transition-colors cursor-pointer shrink-0"
            >
              {copiedWorkspaceEmail ? (
                <>
                  <Check size={14} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Phone */}
          <button
            type="button"
            onClick={() => onEditField("phone")}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
                Phone
              </span>
              <span
                className={`text-sm truncate ${
                  user.phone
                    ? "text-[#1f1f1f] dark:text-[#e3e3e3]"
                    : "text-[#444746] dark:text-[#c4c7c5] italic"
                }`}
              >
                {user.phone || "Add phone number"}
              </span>
            </div>
            <ChevronRight
              size={18}
              className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
            />
          </button>

          {/* Address */}
          <button
            type="button"
            onClick={() => onEditField("address")}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
                Address
              </span>
              <span
                className={`text-sm truncate ${
                  user.address
                    ? "text-[#1f1f1f] dark:text-[#e3e3e3]"
                    : "text-[#444746] dark:text-[#c4c7c5] italic"
                }`}
              >
                {user.address || "Add home or workspace address"}
              </span>
            </div>
            <ChevronRight
              size={18}
              className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
            />
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProfilePersonalInfoTab;
