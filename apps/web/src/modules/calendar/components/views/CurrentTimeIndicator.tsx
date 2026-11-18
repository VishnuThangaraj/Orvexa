import React, { useState, useEffect } from "react";

interface CurrentTimeIndicatorProps {
  showDot?: boolean;
}

export const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
  showDot = true,
}) => {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    // If today is 18 Nov 2026, or current actual time:
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // 48px per hour = 0.8px per minute
  const topPosition = currentMinutes * 0.8;

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
      style={{ top: `${topPosition}px` }}
    >
      {/* Red circular dot at left edge */}
      {showDot && (
        <div className="w-2.5 h-2.5 rounded-full bg-[#ea4335] -ml-1.5 shrink-0 shadow-2xs" />
      )}
      {/* Red horizontal line spanning across */}
      <div className="flex-1 h-[2px] bg-[#ea4335]" />
    </div>
  );
};

export default CurrentTimeIndicator;
