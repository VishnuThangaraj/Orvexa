import React from "react";
import { whatsIncluded } from "../constants/landing.constants";

const LandingIncluded: React.FC = () => {
  return (
    <div className="flex flex-col justify-center gap-15 py-[6%] px-[10%]  text-center">
      <div className="font-semibold text-[40px] leading-normal">
        All the tools that you need and a<br /> few more that we think you'll
        love.
      </div>
      <div className="flex justify-center gap-10">
        {whatsIncluded.map((item, index) => {
          return (
            <div key={`landing-include-${index}`} className="flex flex-col gap-2 size-3/12">
              <div className="text-[24px] font-medium">{item.title}</div>
              <div className="text-[18px] text-[#5F6368]">{item.content}</div>
            </div>
          );
        })}
      </div>
      <div className="text-[20px] font-medium">Orvexa Workspace includes:</div>
    </div>
  );
};

export default LandingIncluded;
