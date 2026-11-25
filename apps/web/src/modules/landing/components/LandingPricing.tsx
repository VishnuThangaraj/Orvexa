import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Check,
  HardDrive,
  Home,
  Mail,
  MessageSquare,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/modules/auth/store/auth.store";

interface PricingFeature {
  text: string;
  icon?: "drive" | "mail" | "meet" | "calendar" | "chat" | "check";
}

interface PricingTier {
  id: string;
  name: string;
  price: string;
  strikethrough?: string;
  billingNote: string;
  ctaLabel: string;
  highlighted?: boolean;
  intro: string;
  features: PricingFeature[];
}

const TIERS: PricingTier[] = [
  {
    id: "community",
    name: "Community",
    price: "₹0",
    billingNote: "per user/month",
    ctaLabel: "Get Started Free",
    highlighted: true,
    intro: "Community includes:",
    features: [
      { text: "Cloud Drive storage (limited only by your own disk)", icon: "drive" },
      { text: "Threaded Webmail via Resend or SMTP", icon: "mail" },
      { text: "Real-time Chat & Spaces locked at 60 FPS", icon: "chat" },
      { text: "LiveKit WebRTC HD Meet rooms (xxx-yyyy-zzz)", icon: "meet" },
      { text: "RRULE Calendar with 1-click Meet binding", icon: "calendar" },
      { text: "Argon2id auth & HTTP-only cookie sessions", icon: "check" },
    ],
  },
  {
    id: "startup",
    name: "Startup",
    price: "₹0",
    billingNote: "per user/month",
    ctaLabel: "Still Free",
    intro: "All of Community, and:",
    features: [
      { text: "Same exact features, just a fancier tier name", icon: "check" },
      { text: "On-the-fly batch ZIP streaming in Drive", icon: "drive" },
      { text: "Exclusive-Arc RBAC & share-link access requests", icon: "check" },
      { text: "Global ⌘K search across your entire workspace", icon: "check" },
      { text: "Zero 'upgrade to unlock dark mode' nonsense", icon: "check" },
    ],
  },
  {
    id: "scaleup",
    name: "Scale-Up",
    price: "₹0",
    strikethrough: "₹0**",
    billingNote: "per user/month",
    ctaLabel: "Overpay Nothing",
    intro: "All of Startup, and:",
    features: [
      { text: "100% discount applied automatically forever", icon: "check" },
      { text: "Redis + BullMQ 30-day trash auto-purge worker", icon: "drive" },
      { text: "Live presence status (Active, Away, DND)", icon: "chat" },
      { text: "Remote session revocation from your Profile", icon: "check" },
      { text: "No per-seat licensing invoice surprises", icon: "check" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹0",
    billingNote: "No need to call sales",
    ctaLabel: "Self-Host Today",
    intro: "All features mentioned, and:",
    features: [
      { text: "Full TypeScript monorepo source code", icon: "check" },
      { text: "Deploy on your servers, cloud, or a Raspberry Pi", icon: "check" },
      { text: "Keep 100% of your data in your own PostgreSQL", icon: "drive" },
      { text: "Customisable Home dashboard widgets", icon: "check" },
      { text: "Unlimited users (your server's problem, not ours)", icon: "check" },
    ],
  },
];

const FeatureIcon: React.FC<{ type?: PricingFeature["icon"] }> = ({ type }) => {
  switch (type) {
    case "drive":
      return <HardDrive size={15} className="text-[#F29900] shrink-0 mt-0.5" />;
    case "mail":
      return <Mail size={15} className="text-[#EA4335] shrink-0 mt-0.5" />;
    case "meet":
      return <Video size={15} className="text-[#00832D] shrink-0 mt-0.5" />;
    case "calendar":
      return <Calendar size={15} className="text-[#1A73E8] shrink-0 mt-0.5" />;
    case "chat":
      return <MessageSquare size={15} className="text-[#00AC47] shrink-0 mt-0.5" />;
    default:
      return <Check size={15} className="text-[#1A73E8] shrink-0 mt-0.5" />;
  }
};

const LandingPricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleCta = () => {
    navigate(isAuthenticated ? "/home" : "/authenticate");
  };

  return (
    <section id="pricing" className="px-[8%] lg:px-[10%] py-[5%]">
      <div className="max-w-305 mx-auto flex flex-col items-center">
        {/* Heading */}
        <h2 className="text-center text-[34px] sm:text-[42px] font-semibold leading-[1.2] text-[#202124] dark:text-slate-100">
          Find the right plan for your
          <br />
          business. Spoiler: it&apos;s free forever.
        </h2>
        <p className="mt-3 text-center text-[15px] text-[#5F6368] dark:text-slate-400">
          Choose the open-source Orvexa Workspace edition that best fits your budget
          (especially if your budget is zero).
        </p>

        {/* Outer rounded container matching reference */}
        <div className="mt-10 w-full rounded-3xl bg-[#F1F3F4] dark:bg-slate-900/90 border border-[#E8EAED] dark:border-slate-800 p-4 sm:p-6">
          {/* Top strip: app icons + annual toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 pb-5">
            <div className="flex items-center gap-3.5">
              <Home size={18} className="text-[#0B57D0]" />
              <Mail size={18} className="text-[#EA4335]" />
              <Calendar size={18} className="text-[#1A73E8]" />
              <HardDrive size={18} className="text-[#F29900]" />
              <MessageSquare size={18} className="text-[#00AC47]" />
              <Video size={18} className="text-[#00832D]" />
            </div>

            <div className="flex items-center gap-3 text-[13px] text-[#3C4043] dark:text-slate-300">
              <span>
                {isAnnual ? (
                  <>
                    Annual{" "}
                    <span className="text-[#137333] dark:text-[#81C995] font-medium">
                      (Save 100% of ₹0 with a one-year commitment)
                    </span>
                  </>
                ) : (
                  <>
                    Monthly{" "}
                    <span className="text-[#5F6368] dark:text-slate-400">
                      (Zero commitment, zero invoice)
                    </span>
                  </>
                )}
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={isAnnual}
                aria-label="Toggle annual billing"
                onClick={() => setIsAnnual((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  isAnnual ? "bg-[#1A73E8]" : "bg-[#BDC1C6] dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                    isAnnual ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 4-column pricing card */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-[#DADCE0] dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 overflow-hidden">
            {TIERS.map((tier, idx) => (
              <div
                key={tier.id}
                className={`flex flex-col p-6 ${
                  tier.highlighted
                    ? "border-2 border-[#1A73E8] rounded-2xl relative z-10 bg-white dark:bg-slate-950"
                    : idx < TIERS.length - 1
                      ? "border-b md:border-b-0 lg:border-r border-[#E8EAED] dark:border-slate-800"
                      : ""
                }`}
              >
                <div className="text-[20px] font-medium text-[#202124] dark:text-slate-100">
                  {tier.name}
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[36px] font-semibold tracking-tight text-[#202124] dark:text-slate-100">
                    {tier.price}
                  </span>
                  {tier.strikethrough && (
                    <span className="text-[14px] text-[#5F6368] dark:text-slate-400 line-through">
                      {tier.strikethrough}
                    </span>
                  )}
                </div>

                <div className="text-[12px] text-[#5F6368] dark:text-slate-400 min-h-4.5">
                  {tier.billingNote}
                </div>

                <div className="mt-5 mb-6">
                  <Button
                    variant={tier.highlighted ? "primary-blue" : "secondary-blue"}
                    onClick={handleCta}
                    className={`w-full rounded-full text-[13.5px] font-medium ${
                      tier.highlighted
                        ? ""
                        : "border border-[#DADCE0] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F8F9FA] dark:hover:bg-slate-800"
                    }`}
                  >
                    {tier.ctaLabel}
                  </Button>
                </div>

                <div className="text-[12.5px] font-medium text-[#202124] dark:text-slate-200 mb-3.5">
                  {tier.intro}
                </div>

                <ul className="flex flex-col gap-3.5">
                  {tier.features.map((feat, fIdx) => (
                    <li
                      key={`${tier.id}-feat-${fIdx}`}
                      className="flex items-start gap-2.5 text-[12.5px] leading-snug text-[#3C4043] dark:text-slate-300"
                    >
                      <FeatureIcon type={feat.icon} />
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom strip inside outer container */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 pt-4 text-[11.5px] text-[#5F6368] dark:text-slate-400">
            <span>
              {isAnnual
                ? "All plans billed annually at ₹0 (auto-renews for ₹0)"
                : "All plans billed monthly at ₹0"}
            </span>
            <span>All prices ₹INR (also $0 USD, €0 EUR, and 0 Dogecoin)</span>
          </div>
        </div>

        {/* Fine print */}
        <div className="mt-5 w-full flex flex-col gap-2 text-[11px] leading-relaxed text-[#5F6368] dark:text-slate-400">
          <p>
            Orvexa Workspace Community, Startup, Scale-Up, and Enterprise editions all
            include the exact same open-source codebase. There is no minimum or
            maximum user limit because we didn&apos;t write a paywall.
          </p>
          <p>
            *Storage capacity in Orvexa Drive depends entirely on how much disk space
            you give your server or Cloudinary account.
          </p>
          <p>
            **100% off ₹0 offer is available to new, existing, and perpetually
            undecided teams for eternity. Actual price may vary by ±0.00% due to
            floating-point rounding.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;
