import React from "react";
import MailSidebar from "../components/MailSidebar";
import MailInbox from "../components/MailInbox";
import useMail from "../hooks/use-mail";
import MailPagination from "../components/MailPagination";

const Mail: React.FC = () => {
  const { activeItem, handleSelectItem } = useMail();

  return (
    <div className="flex h-full w-full bg-[#F8FAFD] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      <MailSidebar activeItem={activeItem} onSelectItem={handleSelectItem} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <MailPagination />
        {activeItem === "inbox" && <MailInbox />}
      </div>
    </div>
  );
};

export default Mail;
