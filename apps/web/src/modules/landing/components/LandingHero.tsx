import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  HardDrive,
  Mail,
  MessageSquare,
  Sparkles,
  User,
  Video,
} from "lucide-react";

const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative overflow-hidden px-[10%] py-10 sm:py-14">
      <div className="relative z-10 max-w-300 mx-auto flex flex-col lg:flex-row items-center justify-between gap-14">
        {/* Left: Copy + CTA */}
        <div className="w-full lg:w-[48%] flex flex-col gap-6">
          <h1 className="font-semibold text-[44px] sm:text-[56px] leading-[1.12] tracking-tight text-[#202124] dark:text-slate-100">
            The unified <br />
            <span>way to work</span>
          </h1>
          <p className="text-[#5F6368] dark:text-slate-400 text-[17.5px] leading-relaxed max-w-122.5">
            Consolidate real-time Chat &amp; Spaces, sub-100ms LiveKit WebRTC
            Meet, versioned Cloud Drive, threaded Webmail, and RRULE Calendar
            into one self-hosted digital workspace.
          </p>
          <div className="pt-1">
            <Button
              variant={"primary-blue"}
              className="rounded-full px-7 py-2.5 text-[15px] font-medium"
              onClick={() =>
                navigate(isAuthenticated ? "/home" : "/authenticate")
              }
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </Button>
          </div>
        </div>

        {/* Right: Floating centered workspace card with orbiting badges */}
        <div className="w-full lg:w-[50%] flex items-center justify-center py-6">
          <div className="relative flex items-center justify-center w-[320px] sm:w-90">
            {/* Top floating blue badge */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-[#1A73E8] text-white shadow-[0_8px_20px_rgba(26,115,232,0.32)] flex items-center justify-center">
              <Sparkles size={18} />
            </div>

            {/* Left floating app badge */}
            <div className="absolute -left-5 sm:-left-7 top-10 z-20 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-[#F1F3F4] dark:border-slate-700 shadow-[0_6px_18px_rgba(32,33,36,0.1)] flex items-center justify-center">
              <Mail size={18} className="text-[#EA4335]" />
            </div>

            {/* Right floating presence/user badge */}
            <div className="absolute -right-5 sm:-right-7 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-[#E8EAED] dark:border-slate-700 shadow-[0_6px_18px_rgba(32,33,36,0.1)] flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#E8F0FE] dark:bg-blue-950 flex items-center justify-center text-[#1A73E8] dark:text-[#8AB4F8]">
                <User size={16} />
              </div>
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#137333] ring-2 ring-white dark:ring-slate-800" />
            </div>

            {/* Main floating white card */}
            <div className="w-67.5 sm:w-72.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E8EAED] dark:border-slate-800 shadow-[0_14px_42px_rgba(32,33,36,0.08)] dark:shadow-[0_14px_42px_rgba(0,0,0,0.4)] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#3C4043] dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-[#1A73E8]" />
                  Orvexa Home
                </span>
                <span className="text-[10px] font-mono text-[#5F6368] dark:text-slate-400">
                  ⌘K
                </span>
              </div>

              <div className="leading-snug">
                <div className="text-[14px] font-medium text-[#1A73E8] dark:text-[#8AB4F8]">
                  Hello, Team
                </div>
                <div className="text-[14px] font-medium text-[#202124] dark:text-slate-100">
                  Ready to collaborate today?
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => navigate("/chat")}
                  className="w-full text-left rounded-lg bg-[#F1F3F4] dark:bg-slate-800/90 hover:bg-[#E8F0FE] dark:hover:bg-slate-800 px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <MessageSquare
                    size={15}
                    className="text-[#00AC47] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-medium text-[#202124] dark:text-slate-100 truncate">
                      Jump into Chat &amp; Spaces
                    </div>
                    <div className="text-[10px] text-[#5F6368] dark:text-slate-400 truncate">
                      Real-time Socket.io channels
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/meet")}
                  className="w-full text-left rounded-lg bg-[#F1F3F4] dark:bg-slate-800/90 hover:bg-[#E8F0FE] dark:hover:bg-slate-800 px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Video size={15} className="text-[#00832D] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-medium text-[#202124] dark:text-slate-100 truncate">
                      Start a LiveKit Meet
                    </div>
                    <div className="text-[10px] text-[#5F6368] dark:text-slate-400 truncate">
                      Sub-100ms WebRTC video call
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/drive")}
                  className="w-full text-left rounded-lg bg-[#F1F3F4] dark:bg-slate-800/90 hover:bg-[#E8F0FE] dark:hover:bg-slate-800 px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <HardDrive size={15} className="text-[#F29900] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-medium text-[#202124] dark:text-slate-100 truncate">
                      Open versioned Drive
                    </div>
                    <div className="text-[10px] text-[#5F6368] dark:text-slate-400 truncate">
                      Folders, ZIP export &amp; RBAC
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#F1F3F4] dark:border-slate-800 text-[10px] text-[#5F6368] dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} className="text-[#1A73E8]" />
                  RRULE Calendar synced
                </span>
                <span>Self-hosted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
