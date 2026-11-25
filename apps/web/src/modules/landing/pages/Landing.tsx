import React from "react";
import LandingHeader from "../components/LandingHeader";
import LandingHero from "../components/LandingHero";
import LandingIncluded from "../components/LandingIncluded";
import LandingFeatures from "../components/LandingFeatures";
import LandingPricing from "../components/LandingPricing";
import LandingLatest from "../components/LandingLatest";
import LandingFAQ from "../components/LandingFAQ";
import LandingFooter from "../components/LandingFooter";

const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen pt-16 scroll-smooth">
      <LandingHeader />
      <div className="pt-20 flex flex-col gap-10">
        <LandingHero />
        <LandingIncluded />
        <LandingFeatures />
        <LandingPricing />
        <LandingFAQ />
        <LandingLatest />
        <LandingFooter />
      </div>
    </div>
  );
};

export default Landing;
