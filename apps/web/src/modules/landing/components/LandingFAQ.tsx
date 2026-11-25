import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FAQ } from "../constants/landing.constants";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const LandingFAQ: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<string[]>([]);
  const navigate = useNavigate();

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
    <section
      id="faq"
      className="bg-[#F8F9FA] dark:bg-slate-900/50 px-[10%] py-[5%] text-center"
    >
      <h2 className="text-[36px] sm:text-[44px] font-semibold text-[#202124] dark:text-slate-100">
        Find the answers that you need
      </h2>
      <div className="flex flex-col lg:flex-row justify-center gap-12 lg:gap-20 mt-4">
        {/* FAQ */}
        <div className="flex flex-col w-full lg:w-[58%] text-left">
          <div className="flex justify-end my-6">
            <Button
              variant={"secondary-blue"}
              className="rounded-full text-[16px] text-[#1A73E8]"
              onClick={toggleAllFAQ}
            >
              {!openAllFAQ ? <div>Expand all</div> : <div>Collapse all</div>}
            </Button>
          </div>
          <span className="border-t border-[#DADCE0] dark:border-slate-800"></span>
          {FAQ.map((item, index) => {
            const isOpen = openFaq.includes(item.id);
            return (
              <div
                key={`landing-faq-${index}`}
                className="flex flex-col gap-3 border-b border-[#DADCE0] dark:border-slate-800 py-8 pb-6 ps-1 select-none"
              >
                <div
                  className="flex justify-between items-center gap-4 text-[20px] font-medium cursor-pointer text-[#202124] dark:text-slate-100"
                  onClick={() => toggleFAQ(item.id)}
                >
                  <div>{item.question}</div>
                  <div className="text-[#1A73E8] shrink-0 transition-all ease-in-out duration-500">
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
                <div
                  className={`text-[16px] text-[#5F6368] dark:text-slate-400 overflow-hidden transition-all duration-300 ease-out ${
                    isOpen
                      ? "max-h-96 opacity-100 mt-2"
                      : "max-h-0 opacity-0 mt-0"
                  }`}
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cards */}
        <div className="flex flex-col justify-start w-full lg:w-[28%] my-6 text-[16px] text-left gap-5">
          <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 border border-[#E8EAED] dark:border-slate-800 p-5 rounded-lg shadow-sm">
            <h3 className="text-[22px] font-medium text-[#202124] dark:text-slate-100">
              Explore Orvexa architecture
            </h3>

            <p className="text-[#5F6368] dark:text-slate-400">
              See how Orvexa unifies Socket.io 4.x messaging, LiveKit WebRTC,
              Cloudinary DAM, and PostgreSQL into a single monorepo.
            </p>

            <a
              href="#latest"
              className="text-[#1A73E8] dark:text-[#8AB4F8] underline cursor-pointer w-fit"
            >
              See highlights
            </a>
          </div>

          <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 border border-[#E8EAED] dark:border-slate-800 p-5 rounded-lg shadow-sm">
            <h3 className="text-[22px] font-medium text-[#202124] dark:text-slate-100">
              Launch your workspace
            </h3>

            <p className="text-[#5F6368] dark:text-slate-400">
              Sign in to access Home, Mail, Chat, Meet, Calendar, Drive, and
              manage your active sessions.
            </p>

            <div>
              <Button
                variant={"secondary-blue"}
                className="text-[#1A73E8] rounded-full"
                onClick={() => navigate("/authenticate")}
              >
                Sign In to Orvexa
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;
