import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import React from "react";
import { useNavigate } from "react-router-dom";

const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex justify-between gap-10">
      <div className="size-1/2">
        <div className="flex flex-col gap-7">
          <div className="font-semibold text-[50px] leading-tight tracking-wide">
            The better <br />
            <span>way to work</span>
          </div>
          <div className={`text-[#5F6368] text-[18px] text-justify`}>
            Join millions of businesses that run on premium versions of Gmail,
            Calendar, Drive, Meet and more. Focus on getting results instead of
            looking for information with helpful, personalised AI.
          </div>
          <div>
            {" "}
            <Button
              variant={"primary-blue"}
              className="rounded-full px-7 text-md"
              onClick={() => navigate("/authenticate")}
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </Button>
          </div>
        </div>
      </div>
      <div className="size-1/2">image here</div>
    </div>
  );
};

export default LandingHero;
