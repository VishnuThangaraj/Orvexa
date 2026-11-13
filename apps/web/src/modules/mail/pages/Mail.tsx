import React from "react";
import MailSidebar from "../components/MailSidebar";
import MailInbox from "../components/mail-category/MailInbox";
import useMail from "../hooks/use-mail";
import MailPagination from "../components/MailPagination";
import MailStarred from "../components/mail-category/MailStarred";
import MailSnoozed from "../components/mail-category/MailSnoozed";
import MailSent from "../components/mail-category/MailSent";
import MailDrafts from "../components/mail-category/MailDrafts";
import MailTrash from "../components/mail-category/MailTrash";

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
