import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  checkboxIconSizes,
  checkboxVariants,
  type CheckboxSize,
  type CheckboxVariant,
} from "./checkbox.variants";

export interface CheckboxProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "size" | "onChange"
    >,
    VariantProps<typeof checkboxVariants> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: boolean;
  indeterminate?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id: externalId,
      name,
      checked: controlledChecked,
      defaultChecked = false,
      disabled = false,
      required = false,
      error = false,
      indeterminate = false,
      variant = "primary-blue",
      size = "md",
      label,
      children,
      helperText,
      className,
      containerClassName,
      labelClassName,
      onCheckedChange,
      onChange,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const id = externalId || generatedId;
    const helperId = helperText ? `${id}-helper` : undefined;

    const [uncontrolledChecked, setUncontrolledChecked] =
      React.useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked;

    const resolvedVariant: CheckboxVariant = variant ?? "primary-blue";
    const resolvedSize: CheckboxSize = size ?? "md";
    const iconSize = checkboxIconSizes[resolvedSize] ?? checkboxIconSizes.md;

    const displayLabel = label ?? children;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const nextChecked = e.target.checked;
      if (!isControlled) {
        setUncontrolledChecked(nextChecked);
      }
      onCheckedChange?.(nextChecked);
      onChange?.(e, nextChecked);
    };

    const state = indeterminate
      ? "indeterminate"
      : isChecked
        ? "checked"
        : "unchecked";

    return (
      <div
        className={cn(
          "inline-flex flex-col text-left",
          disabled && "opacity-60 cursor-not-allowed",
          containerClassName,
        )}
      >
        <label
          htmlFor={id}
          className={cn(
            "group inline-flex items-center gap-2.5 cursor-pointer select-none",
            disabled && "cursor-not-allowed pointer-events-none",
          )}
        >
          <div className="relative flex items-center justify-center">
            {/* Native hidden input for accessibility & keyboard focus */}
            <input
              ref={ref}
              type="checkbox"
              id={id}
              name={name}
              checked={isChecked}
              disabled={disabled}
              required={required}
              aria-invalid={error || undefined}
              aria-describedby={helperId}
              onChange={handleChange}
              className="sr-only peer"
              {...props}
            />

            {/* Visual checkbox box */}
            <div
              data-state={state}
              className={cn(
                checkboxVariants({
                  variant: resolvedVariant,
                  size: resolvedSize,
                  hasError: error,
                }),
                "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
                className,
              )}
              aria-hidden="true"
            >
              {indeterminate ? (
                <Minus
                  size={iconSize}
                  strokeWidth={3}
                  className="animate-in fade-in-50 zoom-in-75 duration-100"
                />
              ) : isChecked ? (
                <Check
                  size={iconSize}
                  strokeWidth={3}
                  className="animate-in fade-in-50 zoom-in-75 duration-100"
                />
              ) : null}
            </div>
          </div>

          {/* Label */}
          {displayLabel && (
            <span
              className={cn(
                "text-sm font-normal text-[#1f1f1f] dark:text-[#e3e3e3] leading-none transition-colors",
                error && "text-red-600 dark:text-red-400",
                labelClassName,
              )}
            >
              {displayLabel}
            </span>
          )}
        </label>

        {/* Helper / Error Text */}
        {helperText && (
          <p
            id={helperId}
            className={cn(
              "text-xs mt-1 transition-colors pl-[28px]",
              error
                ? "text-red-600 dark:text-red-400 font-medium"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
