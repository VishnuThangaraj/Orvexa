import React from "react";

export interface OrvexaIconProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "width" | "height"> {
  size?: number | string;
  width?: number | string;
  height?: number | string;
  className?: string;
  alt?: string;
}

export const OrvexaIcon: React.FC<OrvexaIconProps> = ({
  size = 24,
  width,
  height,
  className = "",
  alt = "Orvexa",
  style,
  ...props
}) => {
  const resolvedWidth = width ?? size;
  const resolvedHeight = height ?? size;

  return (
    <img
      src="/images/icon.svg"
      alt={alt}
      width={typeof resolvedWidth === "number" ? resolvedWidth : undefined}
      height={typeof resolvedHeight === "number" ? resolvedHeight : undefined}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        ...style,
      }}
      className={`inline-block shrink-0 select-none object-contain ${className}`}
      {...props}
    />
  );
};

export default OrvexaIcon;
