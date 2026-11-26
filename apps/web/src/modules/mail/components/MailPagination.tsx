import React, { useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  MoreVertical,
  Trash2,
  MailOpen,
  Mail as MailUnreadIcon,
  ChevronDown,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { useMailStore } from "../store/mail.store";
import { mailKeys } from "../hooks/use-mail.inbox";
import { mailApi } from "../api/mail.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { FetchInboxOptions, FetchInboxResult } from "../types";
import { cn } from "@/lib/utils";

export interface MailPaginationProps {
  className?: string;
  activeCategory?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onRefresh?: () => void;
  isFetching?: boolean;
}

const queryFnMap: Record<
  string,
  (opts?: FetchInboxOptions) => Promise<FetchInboxResult>
> = {
  inbox: mailApi.getInbox,
  starred: mailApi.getStarred,
  sent: mailApi.getSent,
  drafts: mailApi.getDrafts,
  snoozed: mailApi.getSnoozed,
  trash: mailApi.getTrash,
};

const MailPagination: React.FC<MailPaginationProps> = ({
  className,
  activeCategory = "inbox",
  total: controlledTotal,
  page: controlledPage,
  limit: controlledLimit,
  totalPages: controlledTotalPages,
  hasNextPage: controlledHasNextPage,
  hasPrevPage: controlledHasPrevPage,
  onNextPage: controlledOnNextPage,
  onPrevPage: controlledOnPrevPage,
  onRefresh: controlledOnRefresh,
  isFetching: controlledIsFetching,
}) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isSpinning, setIsSpinning] = useState(false);

  const {
    page: storePage,
    limit: storeLimit,
    selectedIds,
    nextPage,
    prevPage,
    selectAll,
    clearSelection,
  } = useMailStore();

  const activePage = controlledPage ?? storePage;
  const activeLimit = controlledLimit ?? storeLimit;

  const currentCategory = activeCategory || "inbox";
  const fetchFn = queryFnMap[currentCategory] || mailApi.getInbox;

  const { data, refetch, isFetching } = useQuery({
    queryKey: [
      ...mailKeys.all,
      currentCategory,
      { page: activePage, limit: activeLimit },
    ],
    queryFn: () => fetchFn({ page: activePage, limit: activeLimit }),
    enabled: isAuthenticated,
  });

  const total = controlledTotal ?? data?.pagination.total ?? 0;
  const totalPages = controlledTotalPages ?? data?.pagination.totalPages ?? 1;
  const hasNextPage =
    controlledHasNextPage ??
    data?.pagination.hasNextPage ??
    activePage < totalPages;
  const hasPrevPage =
    controlledHasPrevPage ?? data?.pagination.hasPrevPage ?? activePage > 1;

  const isFetchingAny = controlledIsFetching ?? isFetching;
  const showSpinning = isSpinning || isFetchingAny;

  const currentIds = data?.messages.map((m) => m.id) || [];
  const selectedCountOnPage = currentIds.filter((id) =>
    selectedIds.includes(id),
  ).length;
  const isAllSelected =
    currentIds.length > 0 && selectedCountOnPage === currentIds.length;
  const isIndeterminate =
    selectedCountOnPage > 0 && selectedCountOnPage < currentIds.length;

  const handleMasterCheckbox = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll(currentIds);
    }
  };

  const handleNextPage = () => {
    if (controlledOnNextPage) {
      controlledOnNextPage();
    } else if (hasNextPage) {
      nextPage();
    }
  };

  const handlePrevPage = () => {
    if (controlledOnPrevPage) {
      controlledOnPrevPage();
    } else if (hasPrevPage) {
      prevPage();
    }
  };

  const handleRefresh = async () => {
    if (showSpinning) return;
    setIsSpinning(true);

    const minSpinDuration = new Promise((resolve) => setTimeout(resolve, 750));

    try {
      if (controlledOnRefresh) {
        await Promise.all([controlledOnRefresh(), minSpinDuration]);
      } else {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: mailKeys.all }),
          refetch(),
          minSpinDuration,
        ]);
      }
    } catch (err) {
      console.error("Failed to refetch mail:", err);
    } finally {
      setIsSpinning(false);
    }
  };

  const [showSelectMenu, setShowSelectMenu] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const handleBatchUpdate = async (updates: {
    isArchived?: boolean;
    isTrashed?: boolean;
    isRead?: boolean;
  }) => {
    if (selectedIds.length === 0 || isMutating) return;
    setIsMutating(true);
    try {
      await mailApi.batchUpdateState(selectedIds, updates);
      clearSelection();
      await queryClient.invalidateQueries({ queryKey: mailKeys.all });
    } catch (err) {
      console.error("Failed to batch update mail state:", err);
    } finally {
      setIsMutating(false);
    }
  };

  const selectFiltered = (filterFn: (m: FetchInboxResult["messages"][number]) => boolean) => {
    const matchingIds = (data?.messages || []).filter(filterFn).map((m) => m.id);
    if (matchingIds.length === 0) {
      clearSelection();
    } else {
      selectAll(matchingIds);
    }
    setShowSelectMenu(false);
  };

  const from = total === 0 ? 0 : (activePage - 1) * activeLimit + 1;
  const to = Math.min(activePage * activeLimit, total);

  return (
    <div
      className={cn(
        "relative flex items-center justify-between px-4 bg-white dark:bg-[#1e1f20] border-b border-[#eceef2] dark:border-[#303134] text-sm select-none shrink-0 h-12 transition-colors",
        className,
      )}
    >
      {/* Subtle indicator bar on refresh */}
      {(showSpinning || isMutating) && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d3e3fd] dark:bg-[#004a77]/40 overflow-hidden z-10">
          <div className="h-full bg-[#0b57d0] dark:bg-[#a8c7fa] w-full animate-pulse" />
        </div>
      )}

      {/* Left section: Checkbox, Dropdown, Actions / Refresh */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center">
          <div className="p-1.5 rounded-l-md hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors flex items-center">
            <Checkbox
              size="sm"
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onCheckedChange={handleMasterCheckbox}
            />
          </div>
          <button
            type="button"
            title="Select options"
            aria-label="Select options"
            onClick={() => setShowSelectMenu((prev) => !prev)}
            className="p-1 py-2 rounded-r-md text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] cursor-pointer transition-colors"
          >
            <ChevronDown className="size-3.5" />
          </button>

          {showSelectMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowSelectMenu(false)}
              />
              <div className="absolute left-0 top-9 z-30 w-36 py-1.5 rounded-xl bg-white dark:bg-[#282a2c] border border-[#e1e3e1] dark:border-[#3c4043] shadow-lg text-xs text-[#1f1f1f] dark:text-[#e3e3e3]">
                <button
                  type="button"
                  onClick={() => {
                    selectAll(currentIds);
                    setShowSelectMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearSelection();
                    setShowSelectMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => selectFiltered((m) => m.isRead)}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
                >
                  Read
                </button>
                <button
                  type="button"
                  onClick={() => selectFiltered((m) => !m.isRead)}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
                >
                  Unread
                </button>
                <button
                  type="button"
                  onClick={() => selectFiltered((m) => m.isStarred)}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
                >
                  Starred
                </button>
              </div>
            </>
          )}
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-1 ml-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#e8f0fe] dark:bg-[#004a77]/60 text-[12px] font-medium text-[#0b57d0] dark:text-[#c2e7ff] mr-1">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => handleBatchUpdate({ isArchived: true })}
              title="Archive"
              aria-label="Archive selected"
              className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Archive className="size-4" />
            </button>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => handleBatchUpdate({ isTrashed: true })}
              title="Delete selection"
              aria-label="Delete selection"
              className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#d93025] dark:hover:text-[#f28b82] hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => handleBatchUpdate({ isRead: true })}
              title="Mark as read"
              aria-label="Mark as read"
              className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer disabled:opacity-50"
            >
              <MailOpen className="size-4" />
            </button>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => handleBatchUpdate({ isRead: false })}
              title="Mark as unread"
              aria-label="Mark as unread"
              className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer disabled:opacity-50"
            >
              <MailUnreadIcon className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 ml-0.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={showSpinning}
              title="Refresh"
              aria-label="Refresh mail"
              className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer disabled:opacity-80"
            >
              <RotateCw
                className={cn(
                  "size-4 transition-transform",
                  showSpinning && "animate-spin text-[#0b57d0] dark:text-[#a8c7fa]",
                )}
              />
            </button>
            <button
              type="button"
              onClick={() => selectFiltered((m) => !m.isRead)}
              title="Select unread"
              aria-label="More actions"
              className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
            >
              <MoreVertical className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right section: Range indicator & Pagination buttons */}
      <div className="flex items-center gap-1 text-xs text-[#444746] dark:text-[#c4c7c5] tabular-nums">
        <span className="px-2 py-1 rounded-md mr-1">
          {total > 0 ? `${from}–${to} of ${total}` : "0 of 0"}
        </span>

        <button
          type="button"
          onClick={handlePrevPage}
          disabled={!hasPrevPage}
          title="Newer"
          aria-label="Newer messages"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={!hasNextPage}
          title="Older"
          aria-label="Older messages"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default MailPagination;
