import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import MailSidebar from "../components/MailSidebar";
import MailInbox from "../components/mail-category/MailInbox";
import useMail from "../hooks/use-mail";
import MailPagination from "../components/MailPagination";
import MailStarred from "../components/mail-category/MailStarred";
import MailSnoozed from "../components/mail-category/MailSnoozed";
import MailSent from "../components/mail-category/MailSent";
import MailDrafts from "../components/mail-category/MailDrafts";
import MailTrash from "../components/mail-category/MailTrash";
import MailThreadView from "../components/thread/MailThreadView";
import { useMailStore } from "../store/mail.store";

const Mail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { activeItem, handleSelectItem } = useMail();
  const activeThreadId = useMailStore((state) => state.activeThreadId);

  // Deep linking to specific email threads
  useEffect(() => {
    const threadId = searchParams.get("threadId");
    if (threadId && useMailStore.getState().activeThreadId !== threadId) {
      useMailStore.setState({
        activeThreadId: threadId,
        activeMessageId: threadId,
        openedFromCategory: "inbox",
      });
    }
  }, [searchParams]);

  const handleCategoryChange = (id: string) => {
    useMailStore.getState().closeThread();
    useMailStore.getState().setPage(1);
    useMailStore.getState().clearSelection();
    handleSelectItem(id);
  };

  return (
    <div className="flex h-full w-full pe-6 bg-[#f6f8fc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden py-3">
      {/* Left Mail Navigation Sidebar */}
      <MailSidebar
        activeItem={activeItem}
        onSelectItem={handleCategoryChange}
      />

      {/* Main Mail Surface - Rounded White Card container */}
      <div className="flex-1 flex flex-col h-[calc(100%-16px)] my-2 mr-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/70 dark:border-slate-800/80 overflow-hidden relative">
        {activeThreadId ? (
          <MailThreadView />
        ) : (
          <>
            <MailPagination activeCategory={activeItem} />
            {activeItem === "inbox" && <MailInbox />}
            {activeItem === "starred" && <MailStarred />}
            {activeItem === "snoozed" && <MailSnoozed />}
            {activeItem === "sent" && <MailSent />}
            {activeItem === "drafts" && <MailDrafts />}
            {activeItem === "trash" && <MailTrash />}
          </>
        )}
      </div>
    </div>
  );
};

export default Mail;
