import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextBox } from "@/components/ui/text-box";
import { useChangePassword } from "@/modules/auth/hooks/use-auth.hooks";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { ApiResponse } from "@/modules/auth/types";

export interface ChangePasswordModalProps {
  onClose: () => void;
}

function getPasswordStrength(password: string): {
  label: string;
  score: number;
  colorClass: string;
} {
  if (!password) {
    return { label: "", score: 0, colorClass: "bg-transparent" };
  }
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { label: "Weak", score: 1, colorClass: "bg-[#b3261e] dark:bg-[#f2b8b5]" };
  }
  if (score === 2) {
    return { label: "Fair", score: 2, colorClass: "bg-[#ea8600] dark:bg-[#fdd663]" };
  }
  if (score === 3) {
    return { label: "Good", score: 3, colorClass: "bg-[#1a73e8] dark:bg-[#a8c7fa]" };
  }
  return { label: "Strong", score: 4, colorClass: "bg-[#137333] dark:bg-[#81c995]" };
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onClose,
}) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentPassword) {
      setErrorMsg("Enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg("New password must be different from your current password.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      // Backend revokes all sessions upon password change; sign user out cleanly
      logout();
      onClose();
      navigate("/authenticate", { replace: true });
    } catch (err) {
      let message = "Unable to change password.";
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
      aria-labelledby="password-modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#1e1f20] text-[#1f1f1f] dark:text-[#e3e3e3] rounded-[28px] shadow-2xl border border-[#e1e3e1] dark:border-[#333537] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2.5">
            <KeyRound size={20} className="text-[#0b57d0] dark:text-[#a8c7fa]" />
            <h3 id="password-modal-title" className="text-lg font-medium">
              Change password
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={changePasswordMutation.isPending}
            aria-label="Close modal"
            className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:bg-[#1f1f1f]/6 dark:hover:bg-[#e3e3e3]/8 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <p className="text-sm text-[#444746] dark:text-[#c4c7c5]">
            Choose a strong password. For security, changing your password signs out all active sessions.
          </p>

          <TextBox
            variant="primary-blue"
            label="Current password"
            labelVariant="floating"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
                className="p-1 text-[#444746] dark:text-[#c4c7c5] cursor-pointer"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            autoFocus
          />

          <div className="space-y-2">
            <TextBox
              variant="primary-blue"
              label="New password"
              labelVariant="floating"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  aria-label={showNew ? "Hide new password" : "Show new password"}
                  className="p-1 text-[#444746] dark:text-[#c4c7c5] cursor-pointer"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {newPassword && (
              <div className="space-y-1 px-1">
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-colors ${
                        step <= strength.score
                          ? strength.colorClass
                          : "bg-[#e1e3e1] dark:bg-[#333537]"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#444746] dark:text-[#c4c7c5]">
                  Password strength: <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          <TextBox
            variant="primary-blue"
            label="Confirm new password"
            labelVariant="floating"
            type={showNew ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

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
              disabled={changePasswordMutation.isPending}
              className="px-5 py-2 rounded-full text-sm font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#0b57d0]/8 dark:hover:bg-[#a8c7fa]/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="empty"
              disabled={changePasswordMutation.isPending}
              loading={changePasswordMutation.isPending}
              className="px-6 py-2 rounded-full text-sm font-medium bg-[#0b57d0] hover:bg-[#0842a0] text-white dark:bg-[#a8c7fa] dark:hover:bg-[#b8d1fb] dark:text-[#062e6f]"
            >
              Change password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
