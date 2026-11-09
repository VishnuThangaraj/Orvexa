import { cva, type VariantProps } from "class-variance-authority";

export const checkboxVariants = cva(
  "relative flex items-center justify-center shrink-0 rounded-[3px] border-2 transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        "primary-blue":
          "border-[#444746] hover:border-[#1f1f1f] dark:border-[#8e918f] dark:hover:border-[#e3e3e3] data-[state=checked]:bg-[#0b57d0] data-[state=checked]:border-[#0b57d0] data-[state=checked]:hover:bg-[#0842a0] data-[state=checked]:hover:border-[#0842a0] data-[state=indeterminate]:bg-[#0b57d0] data-[state=indeterminate]:border-[#0b57d0] text-white focus-visible:ring-[#0b57d0]/40",
        primary:
          "border-[#444746] hover:border-[#1f1f1f] dark:border-[#8e918f] dark:hover:border-[#e3e3e3] data-[state=checked]:bg-[#0b57d0] data-[state=checked]:border-[#0b57d0] data-[state=checked]:hover:bg-[#0842a0] data-[state=checked]:hover:border-[#0842a0] data-[state=indeterminate]:bg-[#0b57d0] data-[state=indeterminate]:border-[#0b57d0] text-white focus-visible:ring-[#0b57d0]/40",
        default:
          "border-slate-500 hover:border-slate-700 dark:border-slate-400 dark:hover:border-slate-200 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 data-[state=indeterminate]:bg-slate-900 data-[state=indeterminate]:border-slate-900 text-white dark:data-[state=checked]:bg-slate-100 dark:data-[state=checked]:border-slate-100 dark:data-[state=checked]:text-slate-900 focus-visible:ring-slate-400",
        indigo:
          "border-slate-500 hover:border-indigo-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=indeterminate]:bg-indigo-600 data-[state=indeterminate]:border-indigo-600 text-white focus-visible:ring-indigo-500/40",
      },
      size: {
        sm: "w-4 h-4",
        md: "w-[18px] h-[18px]",
        lg: "w-5 h-5",
      },
      hasError: {
        true: "border-red-600 data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary-blue",
      size: "md",
      hasError: false,
    },
  },
);

export const checkboxIconSizes = {
  sm: 11,
  md: 13,
  lg: 15,
};

export type CheckboxVariant = NonNullable<
  VariantProps<typeof checkboxVariants>["variant"]
>;
export type CheckboxSize = NonNullable<
  VariantProps<typeof checkboxVariants>["size"]
>;
