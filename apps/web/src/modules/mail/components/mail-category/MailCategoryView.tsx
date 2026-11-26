import React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";
import { LoaderInPage } from "@/common/components/ui/Loader/Loader";
import MailLayout from "../MailLayout";
import { useMailStore } from "../../store/mail.store";
import type { FetchInboxResult } from "../../types";

export interface MailCategoryViewProps {
  category: "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "trash";
  data?: FetchInboxResult;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  emptyIcon?: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  errorLabel: string;
  topBanner?: React.ReactNode;
}

export const MailCategoryView: React.FC<MailCategoryViewProps> = ({
  category,
  data,
  isLoading,
  isError,
  error,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle,
  emptyDescription,
  errorLabel,
  topBanner,
}) => {
  const { selectedIds, toggleSelect, openThread } = useMailStore();

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-[#1e1f20]">
      {topBanner}

      <div className="relative overflow-y-auto flex-1 min-h-50">
        {isLoading && <LoaderInPage />}

        {isError && (
          <div className="flex h-full min-h-[260px] w-full flex-col items-center justify-center px-6 text-center select-none">
            <div className="size-12 rounded-2xl bg-[#fce8e6] dark:bg-[#3c2524] flex items-center justify-center text-[#d93025] dark:text-[#f28b82] mb-3">
              <AlertCircle className="size-6" />
            </div>
            <p className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
              {errorLabel}
            </p>
            <p className="mt-1 text-xs text-[#5e5e5e] dark:text-[#9aa0a6] max-w-sm">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
          </div>
        )}

        {!isLoading && !isError && data?.messages.length === 0 && (
          <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center px-6 text-center select-none">
            <div className="size-14 rounded-2xl bg-[#f2f6fc] dark:bg-[#282a2c] flex items-center justify-center text-[#0b57d0] dark:text-[#a8c7fa] mb-3.5">
              <EmptyIcon className="size-6" />
            </div>
            <p className="text-[15px] font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
              {emptyTitle}
            </p>
            <p className="mt-1 text-xs text-[#5e5e5e] dark:text-[#9aa0a6] max-w-xs">
              {emptyDescription}
            </p>
          </div>
        )}

        {data?.messages.map((mail, idx) => (
          <MailLayout
            key={mail.id}
            mail={mail}
            selected={selectedIds.includes(mail.id)}
            onToggleSelect={toggleSelect}
            onClick={(clickedMail) => {
              openThread(
                clickedMail,
                data.messages,
                idx,
                data.pagination.total,
                category,
              );
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MailCategoryView;
