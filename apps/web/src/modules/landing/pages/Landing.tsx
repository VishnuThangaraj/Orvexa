import React from "react";
import LandingHeader from "../components/LandingHeader";
import LandingHero from "../components/LandingHero";

const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen pt-16">
      <LandingHeader />
      <div className="py-20 px-[10%]">
        <LandingHero />
      </div>
    </div>
  );
};

export default Landing;
