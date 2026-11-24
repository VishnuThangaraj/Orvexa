import React from "react";
import LandingHeader from "../components/LandingHeader";
import LandingHero from "../components/LandingHero";
import LandingIncluded from "../components/LandingIncluded";
import LandingFeatures from "../components/LandingFeatures";
import LandingFAQ from "../components/LandingFAQ";
import LandingFooter from "../components/LandingFooter";

const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen pt-16">
      <LandingHeader />
      <div className="py-20 flex flex-col gap-10">
        <LandingHero />
        <LandingIncluded />
        <LandingFeatures />
        <LandingFAQ />
        <div>sdf</div>
        <LandingFooter/>
      </div>
    </div>
  );
};

export default Landing;
