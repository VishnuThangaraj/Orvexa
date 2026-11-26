import React from "react";
import {
  ChevronRight,
  KeyRound,
  Laptop,
  LogOut,
  ShieldCheck,
  Smartphone,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import {
  useRevokeAllSessions,
  useRevokeSession,
  useSessions,
} from "@/modules/auth/hooks/use-auth.hooks";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { SessionItem, User } from "@/modules/auth/types";

export interface ProfileSecurityTabProps {
  user: User;
  onOpenPasswordModal: () => void;
  onNotify: (message: string) => void;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function summarizeUserAgent(ua?: string | null): {
  label: string;
  isMobile: boolean;
} {
  if (!ua) return { label: "Web session", isMobile: false };
  const isMobile = /android|iphone|ipad|mobile/i.test(ua);

  let browser = "Browser";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return {
    label: os ? `${browser} on ${os}` : browser,
    isMobile,
  };
}

export const ProfileSecurityTab: React.FC<ProfileSecurityTabProps> = ({
  user,
  onOpenPasswordModal,
  onNotify,
}) => {
  const currentSessionId = useAuthStore((state) => state.sessionId);
  const sessionsQuery = useSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllMutation = useRevokeAllSessions();

  const sessions: SessionItem[] = sessionsQuery.data ?? [];

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      onNotify("Device signed out");
    } catch {
      onNotify("Failed to sign out device");
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAllMutation.mutateAsync();
      onNotify("All sessions signed out");
    } catch {
      onNotify("Failed to sign out sessions");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-normal text-[#1f1f1f] dark:text-[#e3e3e3] tracking-tight">
          Security & sign-in
        </h1>
        <p className="text-sm text-[#444746] dark:text-[#c4c7c5]">
          Settings and recommendations to help keep your Orvexa Account secure
        </p>
      </div>

      {/* How you sign in card */}
      <section className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl overflow-hidden">
        <div className="px-6 pt-6 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e6f4ea] dark:bg-[#137333]/25 text-[#137333] dark:text-[#81c995] flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
              How you sign in to Orvexa
            </h2>
            <p className="text-xs text-[#444746] dark:text-[#c4c7c5]">
              Make sure you can always access your account
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#e1e3e1] dark:divide-[#333537]">
          {/* Password Row */}
          <button
            type="button"
            onClick={onOpenPasswordModal}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
              <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5] inline-flex items-center gap-2">
                <KeyRound size={14} />
                Password
              </span>
              <div className="min-w-0">
                <span className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3] block">
                  ••••••••••••
                </span>
                <span className="text-xs text-[#444746] dark:text-[#c4c7c5] block">
                  {user.credentials?.passwordChangedAt
                    ? `Last changed ${formatDateTime(user.credentials.passwordChangedAt)}`
                    : "Click to update your password"}
                </span>
              </div>
            </div>
            <ChevronRight
              size={18}
              className="text-[#444746] dark:text-[#c4c7c5] shrink-0"
            />
          </button>

          {/* Role & Account Status */}
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
            <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
              Account access
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#e6f4ea] text-[#137333] dark:bg-[#137333]/25 dark:text-[#81c995]">
                <BadgeCheck size={13} />
                {user.isActive ? "Active account" : "Inactive"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]">
                {user.role === "ADMIN" ? "Workspace Administrator" : "Member"}
              </span>
            </div>
          </div>

          {/* Last Sign-in */}
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
            <span className="w-40 sm:w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-[#444746] dark:text-[#c4c7c5]">
              Last sign-in
            </span>
            <span className="text-sm text-[#1f1f1f] dark:text-[#e3e3e3]">
              {formatDateTime(user.lastLoginAt)}
            </span>
          </div>
        </div>
      </section>

      {/* Your Devices Card */}
      <section className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
              Your devices
            </h2>
            <p className="text-xs text-[#444746] dark:text-[#c4c7c5] mt-0.5">
              Where you’re currently signed in to Orvexa Workspace
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleRevokeAll}
              disabled={revokeAllMutation.isPending}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#e1e3e1] dark:border-[#3c4043] text-xs font-medium text-[#b3261e] dark:text-[#f2b8b5] hover:bg-[#b3261e]/8 dark:hover:bg-[#f2b8b5]/10 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign out all sessions</span>
            </button>
          )}
        </div>

        {sessionsQuery.isLoading ? (
          <div className="px-6 py-10 flex items-center justify-center gap-2 text-sm text-[#444746] dark:text-[#c4c7c5]">
            <Loader2 size={18} className="animate-spin text-[#0b57d0] dark:text-[#a8c7fa]" />
            <span>Loading active devices...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-6 py-8 text-sm text-[#444746] dark:text-[#c4c7c5]">
            No active device sessions found.
          </div>
        ) : (
          <div className="divide-y divide-[#e1e3e1] dark:divide-[#333537]">
            {sessions.map((session) => {
              const ua = summarizeUserAgent(session.userAgent);
              const DeviceIcon = ua.isMobile ? Smartphone : Laptop;
              const isCurrent =
                Boolean(session.isCurrent) ||
                (currentSessionId ? session.id === currentSessionId : false);

              return (
                <div
                  key={session.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#f0f4f9] dark:bg-[#282a2c] text-[#444746] dark:text-[#c4c7c5] flex items-center justify-center shrink-0 mt-0.5">
                      <DeviceIcon size={19} />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                          {session.deviceName || ua.label}
                        </span>
                        {isCurrent && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e6f4ea] text-[#137333] dark:bg-[#137333]/25 dark:text-[#81c995]">
                            This session
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#444746] dark:text-[#c4c7c5]">
                        {ua.label}
                        {session.ipAddress ? ` • IP ${session.ipAddress}` : ""}
                      </div>
                      <div className="text-xs text-[#444746]/80 dark:text-[#c4c7c5]/80">
                        Last active{" "}
                        {formatDateTime(session.lastUsedAt || session.createdAt)}
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokeSessionMutation.isPending}
                      className="self-start sm:self-center px-4 py-1.5 rounded-full border border-[#747775] dark:border-[#8e918f] text-xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#0b57d0]/8 dark:hover:bg-[#a8c7fa]/10 transition-colors cursor-pointer shrink-0"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfileSecurityTab;
