import React from "react";
import MailSidebar from "../components/MailSidebar";
import MailInbox from "../components/MailInbox";
import useMail from "../hooks/use-mail";
import MailPagination from "../components/MailPagination";
import MailStarred from "../components/MailStarred";
import MailSnoozed from "../components/MailSnoozed";
import MailSent from "../components/MailSent";
import MailDrafts from "../components/MailDrafts";
import MailTrash from "../components/MailTrash";

const Mail: React.FC = () => {
  const { activeItem, handleSelectItem } = useMail();

  return (
    <div className="flex h-full w-full bg-[#F8FAFD] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      <MailSidebar activeItem={activeItem} onSelectItem={handleSelectItem} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <MailPagination />
        {activeItem === "inbox" && <MailInbox />}
        {activeItem === "starred" && <MailStarred />}
        {activeItem === "snoozed" && <MailSnoozed />}
        {activeItem === "sent" && <MailSent />}
        {activeItem === "drafts" && <MailDrafts />}
        {activeItem === "trash" && <MailTrash />}
      </div>
    </div>
  );
};

export default Mail;
