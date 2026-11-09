import React from "react";

const LETTER_COLORS = [
  "text-[#0b63f6] dark:text-[#4c86f9]",
  "text-[#e0200f] dark:text-[#f2594b]",
  "text-[#fbb404] dark:text-[#fcc934]",
  "text-[#04943c] dark:text-[#26b45f]",
  "text-[#0b63f6] dark:text-[#4c86f9]",
  "text-[#e0200f] dark:text-[#f2594b]",
];

export interface OrvexaLogoProps {
  text?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const OrvexaLogo: React.FC<OrvexaLogoProps> = ({
  text = "Orvexa",
  className = "text-[22px] tracking-tight",
  style,
  onClick,
}) => {
  return (
    <span
      onClick={onClick}
      style={{
        fontWeight: 540,
        fontVariationSettings: "'wght' 540",
        ...style,
      }}
      className={`inline-flex items-baseline select-none font-sans leading-none ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {text.split("").map((char, index) => {
        const colorClass = LETTER_COLORS[index % LETTER_COLORS.length];
        return (
          <span key={index} className={colorClass}>
            {char}
          </span>
        );
      })}
    </span>
  );
};

export default OrvexaLogo;
