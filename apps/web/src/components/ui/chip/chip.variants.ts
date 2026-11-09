import { cva, type VariantProps } from "class-variance-authority";

export const chipVariants = cva(
  "inline-flex items-center justify-center text-center font-semibold border backdrop-blur-md shadow-xs leading-none select-none transition-colors duration-200",
  {
    variants: {
      variant: {
        active:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
        success:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
        green:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
        inactive:
          "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60",
        gray:
          "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60",
        danger:
          "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30",
        red:
          "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30",
        warning:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
        yellow:
          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30",
        orange:
          "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
        info:
          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
        blue:
          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
        primary:
          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
        secondary:
          "bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/15",
      },
      size: {
        xs: "px-2.5 py-0.5 text-[11px] gap-1 rounded-full",
        sm: "px-3 py-1 text-xs gap-1.5 rounded-full",
        md: "px-3.5 py-1.5 text-xs gap-1.5 rounded-full",
      },
    },
    defaultVariants: {
      variant: "active",
      size: "sm",
    },
  }
);

export const dotColorsMap: Record<ChipVariant, string> = {
  active: "bg-emerald-500",
  success: "bg-emerald-500",
  green: "bg-emerald-500",
  inactive: "bg-slate-400",
  gray: "bg-slate-400",
  danger: "bg-red-500",
  red: "bg-red-500",
  warning: "bg-amber-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  info: "bg-indigo-500",
  blue: "bg-indigo-500",
  primary: "bg-indigo-500",
  secondary: "bg-slate-400",
};

export const dotSizesMap: Record<ChipSize, string> = {
  xs: "w-1.5 h-1.5",
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
};

export type ChipVariant = NonNullable<VariantProps<typeof chipVariants>["variant"]>;
export type ChipSize = NonNullable<VariantProps<typeof chipVariants>["size"]>;
