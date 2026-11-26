import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextBox } from "@/components/ui/text-box";
import type { ApiResponse, User } from "@/modules/auth/types";
import {
  useUpdateProfile,
  useUsernameAvailability,
} from "../hooks/use-profile.hooks";
import type { UpdateProfileRequest } from "../types/profile.types";

export type EditableProfileField =
  | "fullName"
  | "username"
  | "email"
  | "dob"
  | "gender"
  | "phone"
  | "address";

export interface ProfileEditModalProps {
  field: EditableProfileField;
  user: User;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const FIELD_META: Record<
  EditableProfileField,
  { title: string; description: string }
> = {
  fullName: {
    title: "Name",
    description:
      "Changes to your name will be reflected across your Orvexa Workspace account.",
  },
  username: {
    title: "Username",
    description:
      "Your username is used to sign in and defines your @orvexa.com workspace address.",
  },
  email: {
    title: "Communication email",
    description:
      "Used for account recovery, password resets, and important notifications.",
  },
  dob: {
    title: "Birthday",
    description:
      "Your birthday helps personalize your Orvexa experience.",
  },
  gender: {
    title: "Gender",
    description:
      "Choose how you would like to be addressed across your account.",
  },
  phone: {
    title: "Phone number",
    description:
      "Add a contact phone number for your workspace profile.",
  },
  address: {
    title: "Address",
    description:
      "Your home or workspace location displayed in your personal info.",
  },
};

const GENDER_PRESETS = ["Male", "Female", "Non-binary", "Prefer not to say"];

function getInitialFieldState(field: EditableProfileField, user: User): {
  initialValue: string;
  initialCustomGender: string;
} {
  switch (field) {
    case "fullName":
      return { initialValue: user.fullName || "", initialCustomGender: "" };
    case "username":
      return { initialValue: user.username || "", initialCustomGender: "" };
    case "email":
      return { initialValue: user.email || "", initialCustomGender: "" };
    case "dob":
      return {
        initialValue: user.dob ? String(user.dob).slice(0, 10) : "",
        initialCustomGender: "",
      };
    case "gender": {
      const g = user.gender || "";
      const presetMatch = GENDER_PRESETS.find(
        (p) => p.toLowerCase() === g.toLowerCase(),
      );
      if (presetMatch) {
        return { initialValue: presetMatch, initialCustomGender: "" };
      }
      if (g) {
        return { initialValue: "Custom", initialCustomGender: g };
      }
      return { initialValue: "", initialCustomGender: "" };
    }
    case "phone":
      return { initialValue: user.phone || "", initialCustomGender: "" };
    case "address":
      return { initialValue: user.address || "", initialCustomGender: "" };
  }
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  field,
  user,
  onClose,
  onSuccess,
}) => {
  const [{ initialValue, initialCustomGender }] = useState(() =>
    getInitialFieldState(field, user),
  );
  const [value, setValue] = useState(initialValue);
  const [customGender, setCustomGender] = useState(initialCustomGender);
  const [debouncedUsername, setDebouncedUsername] = useState(
    field === "username" ? user.username || "" : "",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateMutation = useUpdateProfile();

  useEffect(() => {
    if (field !== "username") return;
    const timer = setTimeout(() => {
      setDebouncedUsername(value.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [field, value]);

  const isCheckingUsername =
    field === "username" &&
    debouncedUsername.length >= 2 &&
    debouncedUsername !== user.username.toLowerCase() &&
    /^[a-z0-9](?:[a-z0-9._-]{0,98}[a-z0-9])?$/.test(debouncedUsername);

  const availabilityQuery = useUsernameAvailability(
    debouncedUsername,
    isCheckingUsername,
  );

  const meta = FIELD_META[field];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload: UpdateProfileRequest = {};

    if (field === "fullName") {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setErrorMsg("Full name must be at least 2 characters.");
        return;
      }
      payload.fullName = trimmed;
    } else if (field === "username") {
      const trimmed = value.trim().toLowerCase();
      if (!/^[a-z0-9](?:[a-z0-9._-]{0,98}[a-z0-9])?$/.test(trimmed) || trimmed.length < 2) {
        setErrorMsg(
          "Username must be 2–100 chars using lowercase letters, numbers, dots, underscores, or hyphens.",
        );
        return;
      }
      if (availabilityQuery.data && !availabilityQuery.data.available) {
        setErrorMsg("That username is already taken.");
        return;
      }
      payload.username = trimmed;
    } else if (field === "email") {
      const trimmed = value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
      payload.email = trimmed;
    } else if (field === "dob") {
      payload.dob = value.trim() || null;
    } else if (field === "gender") {
      const resolved =
        value === "Custom" ? customGender.trim() : value.trim();
      if (value === "Custom" && !resolved) {
        setErrorMsg("Please enter your gender or pick another option.");
        return;
      }
      payload.gender = resolved || null;
    } else if (field === "phone") {
      const trimmed = value.trim();
      if (trimmed && !/^[+\d\s().-]{5,20}$/.test(trimmed)) {
        setErrorMsg("Enter a valid phone number (5–20 characters).");
        return;
      }
      payload.phone = trimmed || null;
    } else if (field === "address") {
      payload.address = value.trim() || null;
    }

    try {
      await updateMutation.mutateAsync(payload);
      onSuccess(`${meta.title} updated`);
      onClose();
    } catch (err) {
      let message = `Unable to update ${meta.title.toLowerCase()}.`;
      if (axios.isAxiosError<ApiResponse<null>>(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setErrorMsg(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#1e1f20] text-[#1f1f1f] dark:text-[#e3e3e3] rounded-[28px] shadow-2xl border border-[#e1e3e1] dark:border-[#333537] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h3 id="edit-modal-title" className="text-lg font-medium">
            {meta.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            aria-label="Close modal"
            className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:bg-[#1f1f1f]/6 dark:hover:bg-[#e3e3e3]/8 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <p className="text-sm text-[#444746] dark:text-[#c4c7c5]">
            {meta.description}
          </p>

          {field === "gender" ? (
            <div className="space-y-2.5">
              {[...GENDER_PRESETS, "Custom"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-[#e1e3e1] dark:border-[#333537] hover:bg-[#f8fafd] dark:hover:bg-[#282a2c] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={option}
                    checked={value === option}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-4 h-4 accent-[#0b57d0] dark:accent-[#a8c7fa] cursor-pointer"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
              {value === "Custom" && (
                <TextBox
                  variant="primary-blue"
                  label="Custom gender"
                  labelVariant="floating"
                  value={customGender}
                  onChange={(e) => setCustomGender(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
              )}
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    setValue("");
                    setCustomGender("");
                  }}
                  className="text-xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer"
                >
                  Clear gender
                </button>
              )}
            </div>
          ) : field === "address" ? (
            <div className="space-y-2">
              <label
                htmlFor="edit-address-textarea"
                className="block text-xs font-medium text-[#444746] dark:text-[#c4c7c5]"
              >
                Address
              </label>
              <textarea
                id="edit-address-textarea"
                rows={3}
                maxLength={500}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter your city, state, or full address"
                className="w-full rounded-xl bg-white dark:bg-[#0e0e0e] text-[#1f1f1f] dark:text-[#e3e3e3] border border-[#747775] dark:border-[#8e918f] focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] dark:focus:border-[#a8c7fa] dark:focus:ring-[#a8c7fa] px-4 py-3 text-sm outline-none resize-none"
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              <TextBox
                variant="primary-blue"
                label={meta.title}
                labelVariant="floating"
                type={field === "dob" ? "date" : field === "email" ? "email" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                max={
                  field === "dob"
                    ? new Date().toISOString().slice(0, 10)
                    : undefined
                }
                autoFocus
              />

              {field === "username" && value.trim().length >= 2 && (
                <div className="flex flex-col gap-1.5 text-xs px-1">
                  <div className="text-[#444746] dark:text-[#c4c7c5]">
                    Workspace address:{" "}
                    <span className="font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                      {value.trim().toLowerCase()}@orvexa.com
                    </span>
                  </div>
                  {isCheckingUsername && (
                    <div className="flex items-center gap-1.5">
                      {availabilityQuery.isFetching ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-[#0b57d0] dark:text-[#a8c7fa]" />
                          <span className="text-[#444746] dark:text-[#c4c7c5]">
                            Checking availability...
                          </span>
                        </>
                      ) : availabilityQuery.data?.available ? (
                        <>
                          <CheckCircle2 size={14} className="text-[#137333] dark:text-[#81c995]" />
                          <span className="text-[#137333] dark:text-[#81c995] font-medium">
                            Username is available
                          </span>
                        </>
                      ) : availabilityQuery.data && !availabilityQuery.data.available ? (
                        <>
                          <AlertCircle size={14} className="text-[#b3261e] dark:text-[#f2b8b5]" />
                          <span className="text-[#b3261e] dark:text-[#f2b8b5] font-medium">
                            Username is already taken
                          </span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {(field === "dob" || field === "phone") && value && (
                <button
                  type="button"
                  onClick={() => setValue("")}
                  className="text-xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer"
                >
                  Clear {meta.title.toLowerCase()}
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="text-xs font-medium text-[#b3261e] dark:text-[#f2b8b5] bg-[#f9dedc]/60 dark:bg-[#8c1d18]/30 px-3.5 py-2.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="empty"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-5 py-2 rounded-full text-sm font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#0b57d0]/8 dark:hover:bg-[#a8c7fa]/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="empty"
              disabled={updateMutation.isPending}
              loading={updateMutation.isPending}
              className="px-6 py-2 rounded-full text-sm font-medium bg-[#0b57d0] hover:bg-[#0842a0] text-white dark:bg-[#a8c7fa] dark:hover:bg-[#b8d1fb] dark:text-[#062e6f]"
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
