import { cva, type VariantProps } from "class-variance-authority";

export const textBoxVariants = cva(
  "w-full transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900/40",
  {
    variants: {
      variant: {
        outlined:
          "bg-white/70 dark:bg-white/5 border border-slate-300 dark:border-white/15 rounded-xl shadow-xs focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20 backdrop-blur-md",
        "primary-blue":
          "bg-white dark:bg-slate-900 text-[#1f1f1f] dark:text-[#e3e3e3] border border-[#747775] dark:border-[#8e918f] rounded-[4px] hover:border-[#1f1f1f] dark:hover:border-[#e3e3e3] focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] dark:focus:border-[#8ab4f8] dark:focus:ring-[#8ab4f8]",
        "blue-primary":
          "bg-white dark:bg-slate-900 text-[#1f1f1f] dark:text-[#e3e3e3] border border-[#747775] dark:border-[#8e918f] rounded-[4px] hover:border-[#1f1f1f] dark:hover:border-[#e3e3e3] focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] dark:focus:border-[#8ab4f8] dark:focus:ring-[#8ab4f8]",
        blue:
          "bg-white dark:bg-slate-900 text-[#1f1f1f] dark:text-[#e3e3e3] border border-[#747775] dark:border-[#8e918f] rounded-[4px] hover:border-[#1f1f1f] dark:hover:border-[#e3e3e3] focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] dark:focus:border-[#8ab4f8] dark:focus:ring-[#8ab4f8]",
        filled:
          "bg-slate-100/90 dark:bg-white/10 border-b-2 border-slate-300 dark:border-white/20 rounded-t-xl rounded-b-none focus:border-indigo-600 focus:bg-slate-100 dark:focus:bg-white/15 dark:focus:border-indigo-400",
        standard:
          "bg-transparent border-b-2 border-slate-300 dark:border-white/20 rounded-none px-0 focus:border-indigo-600 dark:focus:border-indigo-400",
      },
      size: {
        sm: "text-xs py-2 px-3 h-10",
        md: "text-base py-3.5 px-4 h-14",
        lg: "text-base py-4 px-4 h-16",
      },
      hasError: {
        true: "border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:focus:border-red-500 dark:focus:ring-red-500/20 text-red-950 dark:text-red-200",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outlined",
      size: "md",
      hasError: false,
    },
  }
);

export type TextBoxVariant = NonNullable<VariantProps<typeof textBoxVariants>["variant"]>;
export type TextBoxSize = NonNullable<VariantProps<typeof textBoxVariants>["size"]>;
