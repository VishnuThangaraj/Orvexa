import React, { useState } from "react";
import { FAQ } from "../constants/landing.constants";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const LandingFAQ: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<string[]>([]);

  const toggleFAQ = (id: string) => {
    if (openFaq.includes(id)) {
      return setOpenFaq((prev) => prev.filter((item) => item !== id));
    }

    return setOpenFaq((prev) => [...prev, id]);
  };
  const openAllFAQ = openFaq.length === FAQ.length;

  const toggleAllFAQ = () => {
    if (openAllFAQ) return setOpenFaq([]);
    return setOpenFaq(FAQ.map((item) => item.id));
  };

  return (
    <div className="bg-[#F8F9FA] px-[10%] py-[5%] text-center">
      <div className="text-[44px] font-semibold">
        Find the answers that you need
      </div>
      <div className="flex justify-center gap-35">
        {/* FAQ */}
        <div className="flex flex-col size-7/10 text-left  max-w-[50%]  ">
          <div className="flex justify-end my-6">
            <Button
              variant={"secondary-blue"}
              className="rounded-full text-[16px] text-[#1A73E8]"
              onClick={toggleAllFAQ}
            >
              {!openAllFAQ ? <div>Expand all</div> : <div>Collapse all</div>}
            </Button>
          </div>
          <span className="border-t border-[#DADCE0]"></span>
          {FAQ.map((item, index) => {
            const isOpen = openFaq.includes(item.id);
            return (
              <div
                key={`landing-faq-${index}`}
                className="flex flex-col gap-3 border-b border-[#DADCE0] py-10 pb-6 ps-1  select-none"
              >
                <div
                  className="flex justify-between text-[20px] font-medium cursor-pointer"
                  onClick={() => toggleFAQ(item.id)}
                >
                  <div>{item.question}</div>
                  <div className="text-[#1A73E8] transition-all ease-in-out duration-500">
                    {isOpen ? <ChevronDown /> : <ChevronUp />}
                  </div>
                </div>
                <div
                  className={`text-[16px] text-[#5F6368] overflow-hidden transition-all duration-300 ease-out ${
                    isOpen
                      ? "max-h-96 opacity-100 mt-2"
                      : "max-h-0 opacity-0 mt-0"
                  }`}
                >
                  {item.answer}
                </div>
              </div>
            );
          })}{" "}
        </div>
        {/* Cards */}
        <div className="flex flex-col justify-start w-[23%] size-3/10 my-6 text-[16px] text-left gap-5">
          <div className="flex flex-col gap-3 bg-white p-5 shadow-sm">
            <div className="text-[24px] font-medium">Build your AI fluency</div>

            <div className="text-[#5F6368]">
              Discover how to transform your industry with AI using Google
              Workspace and Gemini Enterprise through events, guides and more.
            </div>

            <div className="text-[#1A73E8] underline cursor-pointer">
              See resources
            </div>
          </div>

          <div className="flex flex-col gap-3 bg-white p-5 shadow-sm">
            <div className="text-[24px] font-medium">Get admin help</div>

            <div className="text-[#5F6368]">
              Sign in to find specific answers, manage users or get support as a
              developer.
            </div>

            <div className="">
              <Button variant={"secondary-blue"} className="text-[#1A73E8] rounded-full ">Get Support</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingFAQ;
