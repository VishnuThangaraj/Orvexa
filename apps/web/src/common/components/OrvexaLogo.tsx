import React from "react";

const LETTER_COLORS = [
  "text-[#0b63f6] dark:text-[#4c86f9]", // 1. O
  "text-[#e0200f] dark:text-[#f2594b]", // 2. r
  "text-[#fbb404] dark:text-[#fcc934]", // 3. v
  "text-[#04943c] dark:text-[#26b45f]", // 4. e
  "text-[#0b63f6] dark:text-[#4c86f9]", // 5. x
  "text-[#e0200f] dark:text-[#f2594b]", // 6. a
];

export interface OrvexaLogoProps {
  /**
   * Base brand text (defaults to "Orvexa")
   */
  text?: string;
  /**
   * Additional container CSS classes
   */
  className?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

export const OrvexaLogo: React.FC<OrvexaLogoProps> = ({
  text = "Orvexa",
  className = "text-[22px] tracking-tight font-medium",
  onClick,
}) => {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center select-none font-sans leading-none ${className} ${
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
