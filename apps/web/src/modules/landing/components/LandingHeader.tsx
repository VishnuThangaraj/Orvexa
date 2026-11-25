import { OrvexaLogo } from "@/common/components/OrvexaLogo";
import { ThemeToggle } from "@/common/components/ThemeToggle";
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

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

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              type="button"
              onClick={() => scrollToSection("included")}
              className="header-nav-link"
            >
              What's Included
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="header-nav-link"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="header-nav-link"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("latest")}
              className="header-nav-link"
            >
              Latest
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("faq")}
              className="header-nav-link"
            >
              FAQ
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle className="border border-[#E8EAED] dark:border-slate-700/80 bg-[#F8F9FA] dark:bg-slate-800/60" />
          <Button
            variant={"secondary-blue"}
            className="rounded-full"
            onClick={() => scrollToSection("faq")}
          >
            Learn More
          </Button>
          <Button
            variant={"primary-blue"}
            className="rounded-full"
            onClick={() =>
              navigate(isAuthenticated ? "/home" : "/authenticate")
            }
          >
            {isAuthenticated ? "Go to Dashboard" : "Sign In"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
