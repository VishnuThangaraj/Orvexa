import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useProfileDetail } from "../hooks/use-profile.hooks";
import type { ProfileTabId } from "../types/profile.types";
import { ProfileSidebarNav } from "../components/ProfileSidebarNav";
import { ProfileHomeTab } from "../components/ProfileHomeTab";
import { ProfilePersonalInfoTab } from "../components/ProfilePersonalInfoTab";
import { ProfileSecurityTab } from "../components/ProfileSecurityTab";
import { ProfilePreferencesTab } from "../components/ProfilePreferencesTab";
import { ProfilePhotoModal } from "../components/ProfilePhotoModal";
import {
  ProfileEditModal,
  type EditableProfileField,
} from "../components/ProfileEditModal";
import { ChangePasswordModal } from "../components/ChangePasswordModal";

const VALID_TABS: ProfileTabId[] = [
  "home",
  "personal-info",
  "security",
  "preferences",
];

const Profile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const storeUser = useAuthStore((state) => state.user);
  const profileQuery = useProfileDetail();
  const user = profileQuery.data ?? storeUser;

  const tabParam = searchParams.get("tab") as ProfileTabId | null;
  const activeTab: ProfileTabId =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "home";

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<EditableProfileField | null>(
    null,
  );
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleSelectTab = (tab: ProfileTabId) => {
    if (tab === "home") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  if (!user) {
    return (
      <div className="min-h-full w-full bg-[#f0f4f9] dark:bg-[#131314] flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-[#444746] dark:text-[#c4c7c5]">
          <Loader2
            size={20}
            className="animate-spin text-[#0b57d0] dark:text-[#a8c7fa]"
          />
          <span>Loading your Orvexa Account...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-[#f0f4f9] dark:bg-[#131314] text-[#1f1f1f] dark:text-[#e3e3e3] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <ProfileSidebarNav
            user={user}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
          />

          <div className="flex-1 w-full min-w-0 max-w-4xl">
            {activeTab === "home" && (
              <ProfileHomeTab
                user={user}
                onNavigateTab={handleSelectTab}
                onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
                onEditField={setEditingField}
                onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
              />
            )}

            {activeTab === "personal-info" && (
              <ProfilePersonalInfoTab
                user={user}
                onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
                onEditField={setEditingField}
              />
            )}

            {activeTab === "security" && (
              <ProfileSecurityTab
                user={user}
                onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
                onNotify={setToastMessage}
              />
            )}

            {activeTab === "preferences" && (
              <ProfilePreferencesTab
                user={user}
                onNotify={setToastMessage}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isPhotoModalOpen && (
        <ProfilePhotoModal
          onClose={() => setIsPhotoModalOpen(false)}
          user={user}
          onSuccess={setToastMessage}
        />
      )}

      {editingField && (
        <ProfileEditModal
          key={editingField}
          field={editingField}
          user={user}
          onClose={() => setEditingField(null)}
          onSuccess={setToastMessage}
        />
      )}

      {isPasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}

      {/* Snackbar / Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#303134] dark:bg-[#e3e3e3] text-white dark:text-[#1f1f1f] text-sm font-medium shadow-xl animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2
            size={17}
            className="text-[#81c995] dark:text-[#137333] shrink-0"
          />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Profile;
