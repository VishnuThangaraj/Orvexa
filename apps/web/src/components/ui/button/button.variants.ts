import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap transition-all duration-300 ease-out cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100",
  {
    variants: {
      variant: {
        primary:
          "font-bold text-white bg-linear-to-r from-indigo-600 via-violet-600 to-purple-500 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-400 shadow-md shadow-indigo-500/25 dark:shadow-lg dark:shadow-indigo-500/40",
        "blue-primary":
          "font-medium text-white bg-[#1a73e8] hover:bg-[#1765cc] active:bg-[#1557b0] shadow-sm hover:shadow shadow-[#1a73e8]/20 dark:bg-[#1a73e8] dark:hover:bg-[#1967d2] dark:active:bg-[#185abc] dark:shadow-none",
        "primary-blue":
          "font-medium text-white bg-[#1a73e8] hover:bg-[#1765cc] active:bg-[#1557b0] shadow-sm hover:shadow shadow-[#1a73e8]/20 dark:bg-[#1a73e8] dark:hover:bg-[#1967d2] dark:active:bg-[#185abc] dark:shadow-none",
        "secondary-blue":
          "font-medium text-[#1a73e8] hover:text-[#174ea6] bg-transparent hover:bg-[#1a73e8]/5 active:bg-[#1a73e8]/10 border border-[#dadce0] hover:border-[#1a73e8]/40 dark:text-[#8ab4f8] dark:hover:text-[#aecbfa] dark:border-[#5f6368] dark:hover:border-[#8ab4f8]/50 dark:hover:bg-[#8ab4f8]/10 dark:active:bg-[#8ab4f8]/20 rounded-full transition-colors",
        "blue-secondary":
          "font-medium text-[#1a73e8] hover:text-[#174ea6] bg-transparent hover:bg-[#1a73e8]/5 active:bg-[#1a73e8]/10 border border-[#dadce0] hover:border-[#1a73e8]/40 dark:text-[#8ab4f8] dark:hover:text-[#aecbfa] dark:border-[#5f6368] dark:hover:border-[#8ab4f8]/50 dark:hover:bg-[#8ab4f8]/10 dark:active:bg-[#8ab4f8]/20 rounded-full transition-colors",
        c2e7ff:
          "font-medium text-[#001d35] dark:text-[#c2e7ff] bg-[#c2e7ff] hover:bg-[#b3defa] active:bg-[#a8dbfc] dark:bg-[#004a77] dark:hover:bg-[#005a91] dark:active:bg-[#00395c] shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl",
        "#c2e7ff":
          "font-medium text-[#001d35] dark:text-[#c2e7ff] bg-[#c2e7ff] hover:bg-[#b3defa] active:bg-[#a8dbfc] dark:bg-[#004a77] dark:hover:bg-[#005a91] dark:active:bg-[#00395c] shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl",
        compose:
          "font-medium text-[#001d35] dark:text-[#c2e7ff] bg-[#c2e7ff] hover:bg-[#b3defa] active:bg-[#a8dbfc] dark:bg-[#004a77] dark:hover:bg-[#005a91] dark:active:bg-[#00395c] shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl",
        "compose-blue":
          "font-medium text-[#001d35] dark:text-[#c2e7ff] bg-[#c2e7ff] hover:bg-[#b3defa] active:bg-[#a8dbfc] dark:bg-[#004a77] dark:hover:bg-[#005a91] dark:active:bg-[#00395c] shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl",
        "tonal-blue":
          "font-medium text-[#001d35] dark:text-[#c2e7ff] bg-[#c2e7ff] hover:bg-[#b3defa] active:bg-[#a8dbfc] dark:bg-[#004a77] dark:hover:bg-[#005a91] dark:active:bg-[#00395c] shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl",
        "primary-light":
          "font-bold text-indigo-700 dark:text-indigo-300 bg-linear-to-r from-indigo-50/90 via-violet-50/90 to-purple-50/90 hover:from-indigo-100/90 hover:via-violet-100/90 hover:to-purple-100/90 dark:from-indigo-950/50 dark:via-violet-950/50 dark:to-purple-950/50 dark:hover:from-indigo-900/60 dark:hover:via-violet-900/60 dark:hover:to-purple-900/60 border border-indigo-200/80 dark:border-indigo-500/30 backdrop-blur-md shadow-xs shadow-indigo-500/10",
        "primary-outlined":
          "font-bold text-indigo-600 dark:text-indigo-400 bg-white/40 dark:bg-indigo-500/10 hover:bg-indigo-50/90 dark:hover:bg-indigo-500/20 border border-indigo-600/80 dark:border-indigo-400/80 backdrop-blur-md shadow-xs shadow-indigo-500/10",
        "primary-outline":
          "font-bold text-indigo-600 dark:text-indigo-400 bg-white/40 dark:bg-indigo-500/10 hover:bg-indigo-50/90 dark:hover:bg-indigo-500/20 border border-indigo-600/80 dark:border-indigo-400/80 backdrop-blur-md shadow-xs shadow-indigo-500/10",
        secondary:
          "font-bold text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/15 backdrop-blur-md shadow-sm",
        tertiary:
          "font-bold text-slate-600 dark:text-slate-300 bg-slate-500/10 dark:bg-slate-400/10 hover:bg-slate-500/20 dark:hover:bg-slate-400/20 border border-slate-400/20 dark:border-slate-500/30 backdrop-blur-md shadow-sm",
        transparent:
          "font-bold text-slate-600 dark:text-slate-300 bg-white/30 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/15 backdrop-blur-md shadow-sm",
        "transparent-pure":
          "font-medium text-[#1a73e8] hover:text-[#174ea6] dark:text-[#8ab4f8] dark:hover:text-[#aecbfa] bg-transparent hover:bg-[#1a73e8]/10 active:bg-[#1a73e8]/15 dark:bg-transparent dark:hover:bg-[#8ab4f8]/10 dark:active:bg-[#8ab4f8]/20 border-0 border-transparent shadow-none dark:shadow-none transition-colors",
        "pure-transparent":
          "font-medium text-[#1a73e8] hover:text-[#174ea6] dark:text-[#8ab4f8] dark:hover:text-[#aecbfa] bg-transparent hover:bg-[#1a73e8]/10 active:bg-[#1a73e8]/15 dark:bg-transparent dark:hover:bg-[#8ab4f8]/10 dark:active:bg-[#8ab4f8]/20 border-0 border-transparent shadow-none dark:shadow-none transition-colors",
        "transparent-blue":
          "font-medium text-[#1a73e8] hover:text-[#174ea6] dark:text-[#8ab4f8] dark:hover:text-[#aecbfa] bg-transparent hover:bg-[#1a73e8]/10 active:bg-[#1a73e8]/15 dark:bg-transparent dark:hover:bg-[#8ab4f8]/10 dark:active:bg-[#8ab4f8]/20 border-0 border-transparent shadow-none dark:shadow-none transition-colors",
        blue:
          "font-bold text-indigo-600 dark:text-indigo-300 bg-white/50 dark:bg-indigo-500/10 hover:bg-indigo-50/70 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 backdrop-blur-md shadow-sm",
        green:
          "font-bold text-emerald-600 dark:text-emerald-400 bg-white/50 dark:bg-emerald-500/10 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 backdrop-blur-md shadow-sm",
        "green-dark":
          "font-bold text-white bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 shadow-md shadow-emerald-600/25 dark:shadow-lg dark:shadow-emerald-600/40",
        "dark-green":
          "font-bold text-white bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 shadow-md shadow-emerald-600/25 dark:shadow-lg dark:shadow-emerald-600/40",
        yellow:
          "font-bold text-yellow-600 dark:text-yellow-400 bg-white/50 dark:bg-yellow-500/10 hover:bg-yellow-50/70 dark:hover:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-500/30 backdrop-blur-md shadow-sm",
        orange:
          "font-bold text-orange-600 dark:text-orange-400 bg-white/50 dark:bg-orange-500/10 hover:bg-orange-50/70 dark:hover:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30 backdrop-blur-md shadow-sm",
        red:
          "font-bold text-red-600 dark:text-red-400 bg-white/50 dark:bg-red-500/10 hover:bg-red-50/70 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 backdrop-blur-md shadow-sm",
        "red-dark":
          "font-bold text-white bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-600/25 dark:shadow-lg dark:shadow-rose-600/40",
        "dark-red":
          "font-bold text-white bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-600/25 dark:shadow-lg dark:shadow-rose-600/40",
        empty: "",
      },
      size: {
        xs: "px-2.5 py-1.5 text-xs leading-none rounded-lg gap-1.5",
        sm: "px-3.5 py-2 text-sm leading-none rounded-lg gap-2",
        md: "px-6 py-2.5 text-sm leading-none rounded-xl gap-2",
        lg: "px-8 py-3.5 text-base leading-none rounded-2xl gap-2.5",
        compose: "h-14 px-6 text-sm font-medium rounded-2xl gap-3.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export const spinnerSizeMap = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  compose: "w-4 h-4",
};

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;
