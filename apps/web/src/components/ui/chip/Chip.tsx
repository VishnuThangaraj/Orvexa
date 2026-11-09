import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  chipVariants,
  dotColorsMap,
  dotSizesMap,
  type ChipSize,
  type ChipVariant,
} from "./chip.variants";

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  label?: React.ReactNode;
  children?: React.ReactNode;
  dot?: boolean;
  icon?: React.ReactNode;
  onDelete?: () => void;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      label,
      children,
      variant = "active",
      size = "sm",
      dot = false,
      icon,
      onDelete,
      className,
      ...props
    },
    ref
  ) => {
    const content = label ?? children;
    const resolvedVariant: ChipVariant = variant ?? "active";
    const resolvedSize: ChipSize = size ?? "sm";

    const dotColor = dotColorsMap[resolvedVariant] ?? dotColorsMap.active;
    const dotSize = dotSizesMap[resolvedSize] ?? dotSizesMap.sm;

    return (
      <span
        ref={ref}
        className={cn(
          chipVariants({ variant: resolvedVariant, size: resolvedSize }),
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn("rounded-full shrink-0", dotSize, dotColor)}
            aria-hidden="true"
          />
        )}
        {icon && (
          <span className="shrink-0 flex items-center" aria-hidden="true">
            {icon}
          </span>
        )}
        {content && <span className="flex items-center">{content}</span>}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Remove chip"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  }
);

Chip.displayName = "Chip";

export default Chip;
