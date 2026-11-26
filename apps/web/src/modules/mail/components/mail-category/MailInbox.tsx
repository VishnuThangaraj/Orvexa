import React, { useState } from "react";
import { Inbox, Mail } from "lucide-react";
import useMail from "../../hooks/use-mail.inbox";
import { useMailStore } from "../../store/mail.store";
import MailCategoryView from "./MailCategoryView";
import { cn } from "@/lib/utils";

type InboxTab = "primary" | "unread";

const INBOX_TABS: Array<{
  id: InboxTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "primary", label: "Primary", icon: Inbox },
  { id: "unread", label: "Unread", icon: Mail },
];

const MailInbox: React.FC = () => {
  const { page, limit } = useMailStore();
  const [activeTab, setActiveTab] = useState<InboxTab>("primary");

  const queryOptions =
    activeTab === "unread" ? { page, limit, isRead: false } : { page, limit };

  const { data, isLoading, isError, error } = useMail(queryOptions);

  const tabsBar = (
    <div className="flex items-center border-b border-[#eceef2] dark:border-[#2a2b2e] bg-white dark:bg-[#1e1f20] px-2 shrink-0 select-none overflow-x-auto">
      {INBOX_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              useMailStore.getState().setPage(1);
            }}
            className={cn(
              "relative flex items-center gap-3 px-4 md:px-6 h-12 text-[13.5px] font-medium whitespace-nowrap transition-colors cursor-pointer min-w-[130px] md:min-w-[180px]",
              isActive
                ? "text-[#0b57d0] dark:text-[#a8c7fa]"
                : "text-[#444746] dark:text-[#c4c7c5] hover:bg-[#f2f6fc]/80 dark:hover:bg-[#282a2c]",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{tab.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-[#0b57d0] dark:bg-[#a8c7fa]" />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <MailCategoryView
      category="inbox"
      data={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      emptyIcon={Inbox}
      emptyTitle={
        activeTab === "unread"
          ? "No unread messages"
          : "Your Primary tab is empty"
      }
      emptyDescription={
        activeTab === "unread"
          ? "You're all caught up on unread emails."
          : "Messages sent to your inbox will appear here."
      }
      errorLabel="Error loading inbox"
      topBanner={tabsBar}
    />
  );
};

export default MailInbox;
