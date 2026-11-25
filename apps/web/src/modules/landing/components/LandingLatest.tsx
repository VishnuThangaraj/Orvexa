import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  HardDrive,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Video,
  Zap,
} from "lucide-react";
import { LATEST_ITEMS, type LatestCardItem } from "../constants/landing.constants";

const CardArtwork: React.FC<{ variant: LatestCardItem["variant"] }> = ({
  variant,
}) => {
  switch (variant) {
    case "announcement":
      return (
        <div className="h-44 bg-[#F1F3F4] dark:bg-slate-800/70 p-4 flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-65 bg-white dark:bg-slate-900 rounded-lg border border-[#DADCE0] dark:border-slate-700 shadow-sm p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#1A73E8] dark:text-[#8AB4F8]">
                Orvexa Home
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#137333] dark:text-[#81C995] bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#137333] dark:bg-[#81C995]" />
                Active
              </span>
            </div>
            <div className="text-[12px] font-medium text-[#202124] dark:text-slate-100">
              Good evening, ready to collaborate?
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="rounded bg-[#E8F0FE] dark:bg-slate-800 px-2 py-1.5 text-[10px] font-medium text-[#1967D2] dark:text-[#8AB4F8] flex items-center gap-1">
                <Mail size={11} />
                Mail
              </div>
              <div className="rounded bg-emerald-50 dark:bg-slate-800 px-2 py-1.5 text-[10px] font-medium text-[#137333] dark:text-[#81C995] flex items-center gap-1">
                <MessageSquare size={11} />
                Chat
              </div>
              <div className="rounded bg-amber-50 dark:bg-slate-800 px-2 py-1.5 text-[10px] font-medium text-[#B06000] dark:text-[#FDD663] flex items-center gap-1">
                <HardDrive size={11} />
                Drive
              </div>
            </div>
          </div>
        </div>
      );

    case "architecture":
      return (
        <div className="h-44 bg-white dark:bg-slate-900 border-b border-[#E8EAED] dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-[#5F6368] dark:text-slate-400">
            Orvexa Workspace
          </div>
          <div className="leading-tight">
            <div className="text-[20px] font-semibold text-[#1A73E8] dark:text-[#8AB4F8]">
              Orvexa Architecture:
            </div>
            <div className="text-[19px] font-medium text-[#202124] dark:text-slate-100">
              zero context switching,
              <br />
              real-time outcomes
            </div>
          </div>
        </div>
      );

    case "updates":
      return (
        <div className="h-44 bg-linear-to-br from-[#E8F0FE] via-[#F1F5FD] to-[#E6F4EA] dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 p-5 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-[#EA4335]">
              <Mail size={18} />
            </div>
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-[#00AC47]">
              <MessageSquare size={18} />
            </div>
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center text-[#1A73E8]">
              <Video size={20} />
            </div>
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-[#1A73E8]">
              <Calendar size={18} />
            </div>
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-[#F29900]">
              <HardDrive size={18} />
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-[#3C4043] dark:text-slate-200 shadow-xs">
            <Zap size={12} className="text-[#1A73E8]" />
            Socket.io 4.x + LiveKit SFU
          </div>
        </div>
      );

    case "security":
      return (
        <div className="h-44 bg-[#202124] dark:bg-slate-950 p-5 flex items-center justify-between text-white overflow-hidden relative">
          <div className="flex flex-col gap-2 z-10">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8AB4F8]">
              <ShieldCheck size={14} />
              Zero-Knowledge Identity
            </span>
            <div className="text-[16px] font-semibold leading-snug max-w-47.5">
              Argon2id + Rotating HTTP-Only Cookies
            </div>
            <span className="text-[11px] text-slate-300">
              Exclusive-Arc Drive RBAC
            </span>
          </div>
          <div className="w-20 h-20 rounded-2xl bg-[#1A73E8]/20 border border-[#8AB4F8]/30 flex items-center justify-center shrink-0">
            <Lock size={30} className="text-[#8AB4F8]" />
          </div>
        </div>
      );

    case "comparison":
      return (
        <div className="h-44 bg-linear-to-br from-[#3B5BDB] via-[#4C6EF5] to-[#7048E8] p-5 flex flex-col items-center justify-center text-center text-white">
          <div className="text-[20px] font-semibold leading-tight">
            Orvexa Workspace
            <br />
            vs. Fragmented Tools
          </div>
          <div className="mt-2.5 text-[11px] text-white/85">
            One unified TypeScript monorepo instead of six separate silos
          </div>
        </div>
      );
  }
};

const LandingLatest: React.FC = () => {
  return (
    <section id="latest" className="px-[10%] py-[5%]">
      <div className="max-w-360 mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top-left section header slot */}
        <div className="flex flex-col justify-start pt-2 pr-4 gap-3">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#5F6368] dark:text-slate-400">
            ALL THE LATEST
          </span>
          <h2 className="text-[32px] font-semibold leading-[1.2] text-[#202124] dark:text-slate-100">
            Learn more about the future of work.
          </h2>
          <p className="text-[15px] leading-relaxed text-[#5F6368] dark:text-slate-400 max-w-75">
            Stay up to date with the latest releases, architecture highlights
            and more with Orvexa Workspace.
          </p>
        </div>

        {/* 5 latest cards */}
        {LATEST_ITEMS.map((item) => (
          <article
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-[#DADCE0] dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-shadow"
          >
            <CardArtwork variant={item.variant} />

            <div className="p-6 flex flex-col flex-1 justify-between gap-6">
              <div>
                <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#5F6368] dark:text-slate-400 mb-2">
                  {item.eyebrow}
                </div>
                <h3 className="text-[18px] font-medium leading-snug text-[#202124] dark:text-slate-100">
                  {item.title}
                </h3>
              </div>

              {item.to ? (
                <Link
                  to={item.to}
                  className="text-[14px] font-medium text-[#1A73E8] dark:text-[#8AB4F8] hover:underline w-fit"
                >
                  {item.ctaLabel}
                </Link>
              ) : (
                <a
                  href={item.href ?? "#"}
                  className="text-[14px] font-medium text-[#1A73E8] dark:text-[#8AB4F8] hover:underline w-fit"
                >
                  {item.ctaLabel}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default LandingLatest;
