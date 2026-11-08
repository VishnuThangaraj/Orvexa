import React from "react";

const BARS = [
  { color: "bg-[#0b63f6] dark:bg-[#4c86f9]", delay: "0s" },
  { color: "bg-[#e0200f] dark:bg-[#f2594b]", delay: "-0.8s" },
  { color: "bg-[#fbb404] dark:bg-[#fcc934]", delay: "-0.7s" },
  { color: "bg-[#04943c] dark:bg-[#26b45f]", delay: "-0.6s" },
  { color: "bg-[#0b63f6] dark:bg-[#4c86f9]", delay: "-0.5s" },
  { color: "bg-[#e0200f] dark:bg-[#f2594b]", delay: "-0.4s" },
];

const Loader: React.FC = () => {
  return (
    <>
      {/* Keyframes live here so no tailwind.config changes are needed */}
      <style>{`
        @keyframes loader-scale {
          0%, 40%, 100% { transform: scaleY(0.05); }
          20% { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .loader-bar { animation: none !important; transform: scaleY(0.5); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-9999 flex h-screen w-screen items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-neutral-950/70"
        role="status"
        aria-label="Loading"
      >
        <div className="flex h-25 w-25 items-center justify-center gap-1.5">
          {BARS.map((bar, i) => (
            <span
              key={i}
              className={`loader-bar h-12.5 w-1 ${bar.color}`}
              style={{
                animation: "loader-scale 0.9s ease-in-out infinite",
                animationDelay: bar.delay,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Loader;
