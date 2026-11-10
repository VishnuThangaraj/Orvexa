import React from "react";
import MailSidebar from "../components/MailSidebar";

const Mail: React.FC = () => {
  return (
    <div className="flex h-full w-full bg-[#F8FAFD] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      <MailSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Main mail list content area */}
      </div>
    </div>
  );
};

export default Mail;


