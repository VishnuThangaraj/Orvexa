import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Menu, X } from "lucide-react";
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
import MailComposeModal from "../components/MailComposeModal";
import { useMailStore } from "../store/mail.store";

const Mail: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeItem, handleSelectItem } = useMail();
  const activeThreadId = useMailStore((state) => state.activeThreadId);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const composeParam = searchParams.get("compose") === "true";
  const showCompose = isComposeOpen || composeParam;

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
    setIsMobileSidebarOpen(false);
  };

  const handleCloseCompose = () => {
    setIsComposeOpen(false);
    if (composeParam) {
      const next = new URLSearchParams(searchParams);
      next.delete("compose");
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <div className="relative flex h-full w-full bg-[#f6f8fc] dark:bg-[#131314] text-[#1f1f1f] dark:text-[#e3e3e3] overflow-hidden p-2 md:py-2 md:pr-4 md:pl-0 transition-colors">
      {/* Desktop Left Mail Navigation Sidebar */}
      <div className="hidden lg:flex shrink-0 h-full">
        <MailSidebar
          activeItem={activeItem}
          onSelectItem={handleCategoryChange}
          onCompose={() => setIsComposeOpen(true)}
        />
      </div>

      {/* Mobile Drawer Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-50 h-full bg-[#f6f8fc] dark:bg-[#131314] shadow-2xl border-r border-[#e1e3e1] dark:border-[#303134] flex flex-col">
            <div className="flex items-center justify-end px-3 pt-2">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close mail navigation"
                className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="size-4.5" />
              </button>
            </div>
            <MailSidebar
              activeItem={activeItem}
              onSelectItem={handleCategoryChange}
              onCompose={() => {
                setIsMobileSidebarOpen(false);
                setIsComposeOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Mail Surface - Modern Gmail M3 Rounded Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-[#1e1f20] rounded-2xl border border-[#e1e3e1]/80 dark:border-[#303134] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden relative">
        {/* Compact Mobile Top Bar */}
        <div className="flex lg:hidden items-center justify-between px-3 py-2 border-b border-[#eceef2] dark:border-[#303134] bg-[#f8fafd] dark:bg-[#282a2c]">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open mail folders"
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium text-[#444746] dark:text-[#e3e3e3] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <Menu className="size-4" />
            <span className="capitalize">{activeItem}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#c2e7ff] text-[#001d35] text-xs font-semibold cursor-pointer"
          >
            Compose
          </button>
        </div>

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

      {/* Floating Gmail Compose Dock */}
      <MailComposeModal
        isOpen={showCompose}
        onClose={handleCloseCompose}
      />
    </div>
  );
};

export default Mail;
