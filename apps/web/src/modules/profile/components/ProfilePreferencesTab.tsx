import React from "react";
import {
  Bell,
  Globe,
  Monitor,
  Moon,
  Palette,
  Sun,
  Check,
} from "lucide-react";
import { useTheme } from "@/common/theme";
import type { NotificationPreferences, User } from "@/modules/auth/types";
import { useUpdatePreferences } from "../hooks/use-profile.hooks";
import { cn } from "@/lib/utils";

export interface ProfilePreferencesTabProps {
  user: User;
  onNotify: (message: string) => void;
}

const LANGUAGES = [
  { value: "en", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "en-IN", label: "English (India)" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
];

const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const NOTIFICATION_ITEMS: Array<{
  key: keyof NotificationPreferences;
  title: string;
  description: string;
}> = [
  {
    key: "mail",
    title: "Mail notifications",
    description: "Get notified about new incoming workspace emails and replies.",
  },
  {
    key: "chat",
    title: "Chat messages & mentions",
    description: "Receive alerts for direct messages and @mentions in spaces.",
  },
  {
    key: "calendar",
    title: "Calendar & meeting reminders",
    description: "Reminders for upcoming events, invitations, and Meet calls.",
  },
  {
    key: "security",
    title: "Security alerts",
    description: "Important notifications about sign-ins and password changes.",
  },
];

export const ProfilePreferencesTab: React.FC<ProfilePreferencesTabProps> = ({
  user,
  onNotify,
}) => {
  const { theme } = useTheme();
  const updatePrefsMutation = useUpdatePreferences();

  const currentTheme = (user.preferences?.theme || theme || "system") as
    | "light"
    | "dark"
    | "system";
  const currentLanguage = user.preferences?.language || "en";
  const currentTimezone = user.preferences?.timezone || "UTC";
  const currentNotifications: Required<NotificationPreferences> = {
    mail: user.preferences?.notificationPreferences?.mail ?? true,
    chat: user.preferences?.notificationPreferences?.chat ?? true,
    calendar: user.preferences?.notificationPreferences?.calendar ?? true,
    security: user.preferences?.notificationPreferences?.security ?? true,
  };

  const detectedTimezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  const timezoneOptions = Array.from(
    new Set([currentTimezone, detectedTimezone, ...COMMON_TIMEZONES]),
  ).filter(Boolean);

  const handleThemeChange = async (nextTheme: "light" | "dark" | "system") => {
    try {
      await updatePrefsMutation.mutateAsync({ theme: nextTheme });
      onNotify(`Appearance set to ${nextTheme}`);
    } catch {
      onNotify("Could not save theme preference");
    }
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await updatePrefsMutation.mutateAsync({ language });
      onNotify("Language preference updated");
    } catch {
      onNotify("Could not save language preference");
    }
  };

  const handleTimezoneChange = async (timezone: string) => {
    try {
      await updatePrefsMutation.mutateAsync({ timezone });
      onNotify(`Timezone updated to ${timezone}`);
    } catch {
      onNotify("Could not save timezone preference");
    }
  };

  const handleNotificationToggle = async (
    key: keyof NotificationPreferences,
  ) => {
    const nextValue = !currentNotifications[key];
    try {
      await updatePrefsMutation.mutateAsync({
        notificationPreferences: {
          [key]: nextValue,
        },
      });
      onNotify("Notification preference updated");
    } catch {
      onNotify("Could not save notification preference");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-normal text-[#1f1f1f] dark:text-[#e3e3e3] tracking-tight">
          Preferences & privacy
        </h1>
        <p className="text-sm text-[#444746] dark:text-[#c4c7c5]">
          Customize how Orvexa looks and behaves across your devices
        </p>
      </div>

      {/* Appearance Card */}
      <section className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#d3e3fd] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#c2e7ff] flex items-center justify-center shrink-0">
            <Palette size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
              Appearance
            </h2>
            <p className="text-xs text-[#444746] dark:text-[#c4c7c5]">
              Choose Light, Dark, or match your device theme
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              {
                id: "light",
                label: "Light",
                desc: "Bright Material surface",
                icon: Sun,
                previewBg: "bg-[#f0f4f9] border-[#dadce0]",
                previewCard: "bg-white",
              },
              {
                id: "dark",
                label: "Dark",
                desc: "Low-light charcoal surface",
                icon: Moon,
                previewBg: "bg-[#1e1f20] border-[#3c4043]",
                previewCard: "bg-[#0e0e0e]",
              },
              {
                id: "system",
                label: "Device default",
                desc: "Follows OS setting",
                icon: Monitor,
                previewBg:
                  "bg-linear-to-r from-[#f0f4f9] via-[#f0f4f9] to-[#1e1f20] border-[#8e918f]/50",
                previewCard: "bg-white/80 dark:bg-[#1e1f20]/80",
              },
            ] as const
          ).map((option) => {
            const Icon = option.icon;
            const isSelected = currentTheme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleThemeChange(option.id)}
                disabled={updatePrefsMutation.isPending}
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-[#0b57d0] dark:border-[#a8c7fa] bg-[#d3e3fd]/25 dark:bg-[#004a77]/35 ring-1 ring-[#0b57d0] dark:ring-[#a8c7fa]"
                    : "border-[#e1e3e1] dark:border-[#333537] hover:bg-[#f8fafd] dark:hover:bg-[#282a2c]",
                )}
              >
                <div
                  className={cn(
                    "h-14 w-full rounded-xl border p-2 flex items-end justify-end",
                    option.previewBg,
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-7 rounded-md shadow-2xs",
                      option.previewCard,
                    )}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon
                      size={16}
                      className={
                        isSelected
                          ? "text-[#0b57d0] dark:text-[#a8c7fa]"
                          : "text-[#444746] dark:text-[#c4c7c5]"
                      }
                    />
                    <div>
                      <div className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                        {option.label}
                      </div>
                      <div className="text-[11px] text-[#444746] dark:text-[#c4c7c5]">
                        {option.desc}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] text-white dark:text-[#062e6f] flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Language & Timezone Card */}
      <section className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl overflow-hidden">
        <div className="px-6 pt-6 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f0f4f9] dark:bg-[#282a2c] text-[#444746] dark:text-[#c4c7c5] flex items-center justify-center shrink-0">
            <Globe size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
              General preferences for the web
            </h2>
            <p className="text-xs text-[#444746] dark:text-[#c4c7c5]">
              Manage language and regional time settings
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#e1e3e1] dark:divide-[#333537]">
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label
                htmlFor="pref-language"
                className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3] block"
              >
                Language
              </label>
              <span className="text-xs text-[#444746] dark:text-[#c4c7c5]">
                Preferred display language across Orvexa
              </span>
            </div>
            <select
              id="pref-language"
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={updatePrefsMutation.isPending}
              className="px-4 py-2 rounded-xl bg-[#f8fafd] dark:bg-[#131314] text-sm text-[#1f1f1f] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] focus:border-[#0b57d0] dark:focus:border-[#a8c7fa] outline-none cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label
                htmlFor="pref-timezone"
                className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3] block"
              >
                Timezone
              </label>
              <span className="text-xs text-[#444746] dark:text-[#c4c7c5]">
                Used for Calendar events and Mail timestamps
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                id="pref-timezone"
                value={currentTimezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                disabled={updatePrefsMutation.isPending}
                className="px-4 py-2 rounded-xl bg-[#f8fafd] dark:bg-[#131314] text-sm text-[#1f1f1f] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] focus:border-[#0b57d0] dark:focus:border-[#a8c7fa] outline-none cursor-pointer"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              {detectedTimezone && detectedTimezone !== currentTimezone && (
                <button
                  type="button"
                  onClick={() => handleTimezoneChange(detectedTimezone)}
                  className="px-3 py-2 rounded-full text-xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#0b57d0]/8 dark:hover:bg-[#a8c7fa]/10 transition-colors cursor-pointer"
                >
                  Use {detectedTimezone}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Card */}
      <section className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl overflow-hidden">
        <div className="px-6 pt-6 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f0f4f9] dark:bg-[#282a2c] text-[#444746] dark:text-[#c4c7c5] flex items-center justify-center shrink-0">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
              Notifications
            </h2>
            <p className="text-xs text-[#444746] dark:text-[#c4c7c5]">
              Control which workspace alerts you receive
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#e1e3e1] dark:divide-[#333537]">
          {NOTIFICATION_ITEMS.map((item) => {
            const enabled = currentNotifications[item.key];
            return (
              <div
                key={item.key}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                    {item.title}
                  </div>
                  <div className="text-xs text-[#444746] dark:text-[#c4c7c5]">
                    {item.description}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={item.title}
                  disabled={updatePrefsMutation.isPending}
                  onClick={() => handleNotificationToggle(item.key)}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors cursor-pointer",
                    enabled
                      ? "bg-[#0b57d0] border-[#0b57d0] dark:bg-[#a8c7fa] dark:border-[#a8c7fa]"
                      : "bg-[#e1e3e1] border-[#747775] dark:bg-[#333537] dark:border-[#8e918f]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 rounded-full transition-transform shadow-xs",
                      enabled
                        ? "translate-x-5 bg-white dark:bg-[#062e6f]"
                        : "translate-x-0.5 bg-[#747775] dark:bg-[#c4c7c5]",
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ProfilePreferencesTab;
