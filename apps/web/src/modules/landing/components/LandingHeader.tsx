import { OrvexaLogo } from "@/common/components/OrvexaLogo";
import { Button } from "@/components/ui/button";
import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingHeader.css";
import { useAuthStore } from "@/modules/auth/store/auth.store";

interface LandingHeaderProps {
  className?: string;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 w-full h-16 bg-white dark:bg-slate-900 shadow-md flex items-center px-6 ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-10">
          <div className="flex items-baseline gap-1.5">
            <OrvexaLogo />
            <span className="text-[22px] text-black dark:text-[#9aa0a6] tracking-tight leading-none font-medium">
              Workspace
            </span>
          </div>

          <nav className="flex items-center gap-8 text-sm font-medium">
            <span className="header-nav-link">What's Included</span>
            <span className="header-nav-link">Premium Features</span>
            <span className="header-nav-link">FAQ</span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant={"secondary-blue"} className="rounded-full">
            Contact Us
          </Button>
          <Button
            variant={"primary-blue"}
            className="rounded-full"
            onClick={() => navigate("/authenticate")}
          >
            { isAuthenticated ? "Go to Dashboard" : "Sign In"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
