import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  HardDrive,
  Home,
  Mail,
  MessageSquare,
  Video,
} from "lucide-react";
import { INCLUDED_APPS, whatsIncluded } from "../constants/landing.constants";

const APP_STYLES: Record<
  string,
  { icon: React.ReactNode; hoverIcon: React.ReactNode; tileBg: string }
> = {
  Home: {
    icon: <Home size={28} strokeWidth={2} className="text-[#0B57D0] dark:text-[#8AB4F8]" />,
    hoverIcon: <Home size={30} strokeWidth={2} className="text-[#0B57D0] dark:text-[#8AB4F8]" />,
    tileBg: "bg-[#E8F0FE]/70 dark:bg-blue-950/60",
  },
  Mail: {
    icon: <Mail size={28} strokeWidth={2} className="text-[#EA4335] dark:text-[#F28B82]" />,
    hoverIcon: <Mail size={30} strokeWidth={2} className="text-[#EA4335] dark:text-[#F28B82]" />,
    tileBg: "bg-[#FCE8E6]/70 dark:bg-red-950/60",
  },
  Chat: {
    icon: <MessageSquare size={28} strokeWidth={2} className="text-[#00AC47] dark:text-[#81C995]" />,
    hoverIcon: <MessageSquare size={30} strokeWidth={2} className="text-[#00AC47] dark:text-[#81C995]" />,
    tileBg: "bg-[#E6F4EA]/70 dark:bg-emerald-950/60",
  },
  Meet: {
    icon: <Video size={28} strokeWidth={2} className="text-[#00832D] dark:text-[#5BB974]" />,
    hoverIcon: <Video size={30} strokeWidth={2} className="text-[#00832D] dark:text-[#5BB974]" />,
    tileBg: "bg-[#E6F4EA]/70 dark:bg-green-950/60",
  },
  Calendar: {
    icon: <Calendar size={28} strokeWidth={2} className="text-[#1A73E8] dark:text-[#8AB4F8]" />,
    hoverIcon: <Calendar size={30} strokeWidth={2} className="text-[#1A73E8] dark:text-[#8AB4F8]" />,
    tileBg: "bg-[#E8F0FE]/70 dark:bg-sky-950/60",
  },
  Drive: {
    icon: <HardDrive size={28} strokeWidth={2} className="text-[#F29900] dark:text-[#FDD663]" />,
    hoverIcon: <HardDrive size={30} strokeWidth={2} className="text-[#F29900] dark:text-[#FDD663]" />,
    tileBg: "bg-[#FEF7E0]/70 dark:bg-amber-950/60",
  },
};

const LandingIncluded: React.FC = () => {
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  return (
    <section
      id="included"
      className="relative overflow-hidden py-[6%] px-[10%] text-center bg-white dark:bg-slate-950"
    >
      {/* Soft pastel radial mesh gradient matching reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:opacity-25"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 55% 65% at 8% 35%, rgba(250, 224, 240, 0.72) 0%, transparent 70%)",
            "radial-gradient(ellipse 50% 60% at 92% 60%, rgba(210, 227, 252, 0.78) 0%, transparent 72%)",
            "radial-gradient(ellipse 45% 55% at 20% 88%, rgba(224, 231, 255, 0.65) 0%, transparent 70%)",
            "radial-gradient(ellipse 40% 45% at 78% 15%, rgba(232, 240, 254, 0.55) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      {/* Top & bottom soft white fades so gradient blends seamlessly into neighboring sections */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-white dark:from-slate-950 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-white dark:from-slate-950 to-transparent"
      />

      <div className="relative z-10 flex flex-col items-center gap-12 max-w-290 mx-auto">
        <h2 className="font-semibold text-[34px] sm:text-[40px] leading-[1.22] tracking-tight text-[#202124] dark:text-slate-100">
          All the tools that your team needs and a
          <br className="hidden sm:inline" /> few more that you&apos;ll love.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-245">
          {whatsIncluded.map((item, index) => (
            <div
              key={`landing-include-${index}`}
              className="flex flex-col gap-2.5 text-center"
            >
              <h3 className="text-[19px] font-semibold text-[#202124] dark:text-slate-100">
                {item.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-[#5F6368] dark:text-slate-400">
                {item.content}
              </p>
            </div>
          ))}
        </div>

        {/* App icon strip with hover-pop card */}
        <div className="flex flex-col items-center gap-6 w-full pt-2">
          <div className="text-[15px] font-medium text-[#202124] dark:text-slate-200">
            Orvexa Workspace includes:
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-9 min-h-33"
            onMouseLeave={() => setHoveredApp(null)}
          >
            {INCLUDED_APPS.map((app) => {
              const style = APP_STYLES[app.name];
              const isActive = hoveredApp === app.name;

              return (
                <div
                  key={app.name}
                  className={`relative flex items-center justify-center w-19 h-22 ${
                    isActive ? "z-20" : "z-0"
                  }`}
                  onMouseEnter={() => setHoveredApp(app.name)}
                >
                  {/* Resting icon + label (no box, directly on gradient) */}
                  <Link
                    to={app.to}
                    onFocus={() => setHoveredApp(app.name)}
                    className={`flex flex-col items-center gap-2.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive
                        ? "opacity-0 scale-90 pointer-events-none"
                        : "opacity-100 scale-100"
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
                      {style.icon}
                    </div>
                    <span className="text-[12px] font-medium text-[#3C4043] dark:text-slate-300">
                      {app.name}
                    </span>
                  </Link>

                  {/* Elevated hover card matching reference */}
                  <Link
                    to={app.to}
                    tabIndex={-1}
                    aria-hidden={!isActive}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-39.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E8EAED] dark:border-slate-700 shadow-[0_12px_32px_rgba(32,33,36,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] p-4 flex flex-col items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] origin-center ${
                      isActive
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-90 pointer-events-none"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isActive ? "scale-105" : "scale-95"
                      } ${style.tileBg}`}
                    >
                      {style.hoverIcon}
                    </div>
                    <div className="text-[14px] font-semibold text-[#202124] dark:text-slate-100">
                      {app.name}
                    </div>
                    <div className="text-[11.5px] text-[#5F6368] dark:text-slate-400 leading-snug">
                      {app.description}
                    </div>
                    <span className="text-[12px] font-medium text-[#1A73E8] dark:text-[#8AB4F8] underline mt-0.5">
                      Learn More
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingIncluded;
