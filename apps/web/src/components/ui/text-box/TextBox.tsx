import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { textBoxVariants } from "./text-box.variants";

export interface TextBoxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof textBoxVariants> {
  label?: React.ReactNode;
  labelVariant?: "static" | "floating";
  helperText?: React.ReactNode;
  error?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
}

const adornmentPaddingLeft = {
  sm: "pl-8",
  md: "pl-11",
  lg: "pl-12",
};

const adornmentPaddingRight = {
  sm: "pr-8",
  md: "pr-11",
  lg: "pr-12",
};

const labelBaseColors: Record<string, string> = {
  outlined:
    "text-slate-600 dark:text-slate-400 peer-placeholder-shown:text-slate-400 dark:peer-placeholder-shown:text-slate-500",
  filled:
    "text-slate-600 dark:text-slate-400 peer-placeholder-shown:text-slate-400 dark:peer-placeholder-shown:text-slate-500",
  standard:
    "text-slate-600 dark:text-slate-400 peer-placeholder-shown:text-slate-400 dark:peer-placeholder-shown:text-slate-500",
  "primary-blue":
    "text-[#444746] dark:text-[#c4c7c5] peer-placeholder-shown:text-[#444746] dark:peer-placeholder-shown:text-[#c4c7c5]",
  "blue-primary":
    "text-[#444746] dark:text-[#c4c7c5] peer-placeholder-shown:text-[#444746] dark:peer-placeholder-shown:text-[#c4c7c5]",
  blue:
    "text-[#444746] dark:text-[#c4c7c5] peer-placeholder-shown:text-[#444746] dark:peer-placeholder-shown:text-[#c4c7c5]",
};

const labelFocusColors: Record<string, string> = {
  outlined: "peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400",
  filled: "peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400",
  standard: "peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400",
  "primary-blue": "peer-focus:text-[#0b57d0] dark:peer-focus:text-[#8ab4f8]",
  "blue-primary": "peer-focus:text-[#0b57d0] dark:peer-focus:text-[#8ab4f8]",
  blue: "peer-focus:text-[#0b57d0] dark:peer-focus:text-[#8ab4f8]",
};

export const TextBox = React.forwardRef<HTMLInputElement, TextBoxProps>(
  (
    {
      id: externalId,
      className,
      containerClassName,
      variant = "outlined",
      size = "md",
      labelVariant = "static",
      error = false,
      label,
      helperText,
      startAdornment,
      endAdornment,
      fullWidth = true,
      disabled = false,
      required = false,
      placeholder,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = externalId || generatedId;
    const helperTextId = helperText ? `${id}-helper` : undefined;

    const resolvedSize = size ?? "md";
    const isFloating = labelVariant === "floating" && Boolean(label);

    return (
      <div
        className={cn(
          "flex flex-col text-left",
          fullWidth ? "w-full" : "w-auto inline-flex",
          containerClassName
        )}
      >
        {/* Static Label */}
        {label && !isFloating && (
          <label
            htmlFor={id}
            className={cn(
              "text-xs font-semibold mb-1.5 transition-colors select-none",
              error
                ? "text-red-600 dark:text-red-400"
                : "text-slate-700 dark:text-slate-300",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        {/* Input Wrapper */}
        <div className="relative flex items-center w-full">
          {startAdornment && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 z-10">
              {startAdornment}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            required={required}
            aria-invalid={error || undefined}
            aria-describedby={helperTextId}
            placeholder={isFloating ? placeholder || " " : placeholder}
            className={cn(
              "peer",
              textBoxVariants({ variant, size: resolvedSize, hasError: error }),
              startAdornment && adornmentPaddingLeft[resolvedSize],
              endAdornment && adornmentPaddingRight[resolvedSize],
              className
            )}
            {...props}
          />

          {/* Floating Label */}
          {label && isFloating && (
            <label
              htmlFor={id}
              className={cn(
                "absolute transition-all duration-200 pointer-events-none select-none origin-left z-10",
                startAdornment
                  ? "left-10 peer-focus:left-9 peer-not-placeholder-shown:left-9"
                  : "left-4 peer-focus:left-3 peer-not-placeholder-shown:left-3",
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100",
                "peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:scale-75 peer-focus:px-1.5 peer-focus:bg-white dark:peer-focus:bg-slate-900",
                "peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:px-1.5 peer-not-placeholder-shown:bg-white dark:peer-not-placeholder-shown:bg-slate-900",
                error
                  ? "text-red-600 dark:text-red-400 peer-focus:text-red-600 dark:peer-focus:text-red-400 peer-placeholder-shown:text-red-600 dark:peer-placeholder-shown:text-red-400"
                  : cn(
                      labelBaseColors[variant ?? "outlined"] ??
                        "text-slate-600 dark:text-slate-400 peer-placeholder-shown:text-slate-400 dark:peer-placeholder-shown:text-slate-500",
                      labelFocusColors[variant ?? "outlined"] ??
                        "peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400"
                    ),
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}

          {endAdornment && (
            <div className="absolute right-3 flex items-center text-slate-400 dark:text-slate-500 z-10">
              {endAdornment}
            </div>
          )}
        </div>

        {/* Helper Text / Error Message */}
        {helperText && (
          <p
            id={helperTextId}
            className={cn(
              "text-xs mt-1 transition-colors",
              error
                ? "text-red-600 dark:text-red-400 font-medium"
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextBox.displayName = "TextBox";

// Alias for developers familiar with MUI's TextField naming
export const TextField = TextBox;

export default TextBox;
