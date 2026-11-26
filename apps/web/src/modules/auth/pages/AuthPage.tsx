import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { User } from "lucide-react";
import OrvexaIcon from "@/common/components/OrvexaIcon";
import ThemeToggle from "@/common/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { TextBox } from "@/components/ui/text-box";
import { Checkbox } from "@/components/ui/checkbox";
import { initialLoginState } from "../states/initial-login.state";
import { useForgotPassword, useLogin } from "../hooks/use-auth.hooks";
import type { ApiResponse } from "../types";

interface FormErrors {
  identifier?: string;
  password?: string;
}

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [credentials, setCredentials] = useState(initialLoginState);
  const [isPasswordStep, setIsPasswordStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const loginMutation = useLogin();
  const forgotPasswordMutation = useForgotPassword();

  const redirectPath =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    "/home";

  const displayedIdentifier = credentials.identifier.includes("@")
    ? credentials.identifier
    : `${credentials.identifier}@orvexa.com`;

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      identifier: e.target.value,
    }));
    if (errors.identifier) {
      setErrors((prev) => ({ ...prev, identifier: undefined }));
    }
    if (infoMessage) {
      setInfoMessage(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      password: e.target.value,
    }));
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (infoMessage) {
      setInfoMessage(null);
    }
  };

  const handleBackToIdentifier = () => {
    setIsPasswordStep(false);
    setErrors((prev) => ({ ...prev, password: undefined }));
    setInfoMessage(null);
  };

  const handleProceedToPassword = () => {
    const trimmedIdentifier = credentials.identifier.trim();
    if (!trimmedIdentifier) {
      setErrors({ identifier: "Enter an email or username" });
      return;
    }

    setErrors({});
    setInfoMessage(null);
    setIsPasswordStep(true);
  };

  const handleLoginSubmit = () => {
    const trimmedIdentifier = credentials.identifier.trim();
    if (!trimmedIdentifier) {
      setIsPasswordStep(false);
      setErrors({ identifier: "Enter an email or username" });
      return;
    }

    if (!credentials.password) {
      setErrors({ password: "Enter a password" });
      return;
    }

    setErrors({});
    setInfoMessage(null);

    loginMutation.mutate(
      {
        identifier: trimmedIdentifier,
        password: credentials.password,
      },
      {
        onSuccess: () => {
          navigate(redirectPath, { replace: true });
        },
        onError: (error) => {
          let message =
            "Invalid credentials. Please check your password and try again.";
          if (
            axios.isAxiosError<ApiResponse<null>>(error) &&
            error.response?.data?.message
          ) {
            message = error.response.data.message;
          }
          setErrors({ password: message });
        },
      },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordStep) {
      handleProceedToPassword();
    } else {
      handleLoginSubmit();
    }
  };

  const handleForgotPassword = () => {
    const trimmedIdentifier = credentials.identifier.trim();
    if (!trimmedIdentifier) {
      setIsPasswordStep(false);
      setErrors({ identifier: "Enter an email or username" });
      return;
    }

    setErrors({});
    setInfoMessage(null);

    forgotPasswordMutation.mutate(
      { identifier: trimmedIdentifier },
      {
        onSuccess: (message) => {
          setInfoMessage(
            message ||
              "If that account exists, a password reset link has been sent.",
          );
        },
        onError: (error) => {
          let message =
            "Unable to request password reset. Please try again later.";
          if (
            axios.isAxiosError<ApiResponse<null>>(error) &&
            error.response?.data?.message
          ) {
            message = error.response.data.message;
          }
          setErrors({ password: message });
        },
      },
    );
  };

  const handleForgotEmail = () => {
    setInfoMessage(
      "Enter your workspace username or contact your administrator.",
    );
  };

  const isPending =
    loginMutation.isPending || forgotPasswordMutation.isPending;

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full bg-[#f0f4f9] dark:bg-[#1e1f20] p-4 transition-colors duration-200">
      <div className="w-full max-w-262 flex flex-col gap-4">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full flex flex-col justify-between gap-7 bg-white dark:bg-[#0e0e0e] text-[#1f1f1f] dark:text-[#e3e3e3] p-10 rounded-3xl shadow-md dark:shadow-none transition-colors duration-200"
        >
          <OrvexaIcon size={50} />
          <div className="flex justify-between gap-x-40">
            <div className="flex flex-col gap-5 w-6/12">
              {isPasswordStep ? (
                <>
                  <div className="text-4xl text-[#1f1f1f] dark:text-[#e3e3e3]">
                    Welcome
                  </div>
                  <div>
                    {" "}
                    <Button
                      type="button"
                      variant={"empty"}
                      className="px-3 py-1.5 rounded-full cursor-pointer bg-transparent text-[#1f1f1f] dark:text-[#e3e3e3] border border-[#747775] dark:border-[#8e918f] hover:bg-[#1f1f1f]/6 dark:hover:bg-[#e3e3e3]/8 font-medium text-sm gap-2"
                      onClick={handleBackToIdentifier}
                      title="Switch account"
                    >
                      <User size={14} />
                      {displayedIdentifier}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl text-[#1f1f1f] dark:text-[#e3e3e3]">
                    Sign in
                  </div>
                  <div className="text-[#444746] dark:text-[#c4c7c5]">
                    Use your Orvexa Account
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col w-9/12 text-[15px]">
              {isPasswordStep ? (
                <div className="flex flex-col gap-3">
                  <TextBox
                    variant="primary-blue"
                    label="Enter your password"
                    labelVariant="floating"
                    className="py-4"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={handlePasswordChange}
                    error={Boolean(errors.password)}
                    helperText={errors.password || infoMessage}
                    disabled={isPending}
                    autoFocus
                  />
                  <Checkbox
                    id="show-password"
                    label="Show password"
                    checked={showPassword}
                    onCheckedChange={setShowPassword}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-10">
                  <div className="flex flex-col gap-3">
                    <TextBox
                      variant="primary-blue"
                      label="Email or username"
                      labelVariant="floating"
                      className="py-4"
                      value={credentials.identifier}
                      onChange={handleIdentifierChange}
                      error={Boolean(errors.identifier)}
                      helperText={errors.identifier || infoMessage}
                      disabled={isPending}
                      autoFocus
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={handleForgotEmail}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleForgotEmail();
                        }
                      }}
                      className="text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer font-medium select-none w-fit"
                    >
                      Forgot email?
                    </div>
                  </div>
                  <div>
                    <div className="text-[#444746] dark:text-[#c4c7c5]">
                      Not your computer? Use Guest mode to sign in privately.
                      <span className="ps-2 cursor-pointer hover:underline text-[#0b57d0] dark:text-[#a8c7fa]">
                        Learn more about using Guest mode
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-2 gap-4">
            <Button
              type="button"
              variant={"transparent-pure"}
              onClick={
                isPasswordStep ? handleForgotPassword : () => navigate("/")
              }
              className="rounded-full py-3.5 text-[#0b57d0] hover:text-[#0842a0] hover:bg-[#0b57d0]/8 active:bg-[#0b57d0]/12 dark:text-[#a8c7fa] dark:hover:text-[#d3e3fd] dark:hover:bg-[#a8c7fa]/8 dark:active:bg-[#a8c7fa]/12"
              disabled={isPending}
            >
              {isPasswordStep ? "Forgot Password?" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant={"primary-blue"}
              className="rounded-full py-3.5 bg-[#0b57d0] hover:bg-[#0842a0] active:bg-[#0842a0] text-white dark:bg-[#a8c7fa] dark:hover:bg-[#b8d1fb] dark:active:bg-[#93b8f7] dark:text-[#062e6f]"
              loading={isPending}
              disabled={isPending}
            >
              Next
            </Button>
          </div>
        </form>
        <div className="text-[#444746] dark:text-[#c4c7c5] flex justify-between items-center text-sm w-full px-4">
          <div className="flex items-center gap-2">
            <span>English (United States)</span>
            <ThemeToggle size={15} />
          </div>
          <div className="flex justify-between gap-7">
            <div className="cursor-pointer hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3]">
              Help
            </div>
            <div className="cursor-pointer hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3]">
              Privacy
            </div>
            <div className="cursor-pointer hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3]">
              Terms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
