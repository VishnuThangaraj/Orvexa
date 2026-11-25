import React from "react";
import { LANDING_FEATURES } from "../constants/landing.constants";

const LandingFeatures: React.FC = () => {
  return (
    <section id="features" className="flex flex-col gap-10 px-[10%] py-[4%]">
      <div className="text-center max-w-195 mx-auto flex flex-col gap-3">
        <h2 className="text-[36px] sm:text-[40px] font-semibold text-[#202124] dark:text-slate-100">
          Self-hosted control. Enterprise-grade performance.
        </h2>
        <p className="text-[17px] text-[#5F6368] dark:text-slate-400">
          Every module in Orvexa is built on a shared PostgreSQL, Redis, Socket.io,
          and LiveKit backbone—no third-party silos or per-seat bloat.
        </p>
      </div>

      <div className="max-w-360 mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LANDING_FEATURES.map((feature) => (
          <div
            key={feature.eyebrow}
            className="rounded-xl border border-[#DADCE0] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-2.5 shadow-2xs"
          >
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#1A73E8] dark:text-[#8AB4F8]">
              {feature.eyebrow}
            </span>
            <h3 className="text-[20px] font-medium text-[#202124] dark:text-slate-100">
              {feature.title}
            </h3>
            <p className="text-[14.5px] leading-relaxed text-[#5F6368] dark:text-slate-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LandingFeatures;
