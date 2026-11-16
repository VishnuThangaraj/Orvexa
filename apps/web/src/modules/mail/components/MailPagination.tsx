import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  MoreVertical,
  Trash2,
  MailOpen,
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

  const from = total === 0 ? 0 : (activePage - 1) * activeLimit + 1;
  const to = Math.min(activePage * activeLimit, total);

  return (
    <div
      className={cn(
        "relative flex items-center justify-between px-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 text-sm select-none shrink-0 h-11",
        className,
      )}
    >
      {/* Subtle indicator bar on refresh */}
      {showSpinning && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-100 dark:bg-blue-950 overflow-hidden z-10">
          <div className="h-full bg-[#0b57d0] w-full animate-pulse" />
        </div>
      )}

      {/* Left section: Checkbox, Dropdown, Actions / Refresh */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <Checkbox
            size="sm"
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onCheckedChange={handleMasterCheckbox}
          />
          <button
            type="button"
            title="Select all / none"
            onClick={handleMasterCheckbox}
            className="p-1 -ml-0.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              onClick={clearSelection}
              title="Delete selection"
              className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={clearSelection}
              title="Mark as read"
              className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MailOpen className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={showSpinning}
              title="Refresh"
              className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-80"
            >
              <RotateCw
                className={cn(
                  "size-4 transition-transform",
                  showSpinning && "animate-spin text-[#0b57d0]",
                )}
              />
            </button>
            <button
              type="button"
              title="More"
              className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MoreVertical className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right section: Range indicator & Pagination buttons */}
      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
        <span className="mr-2">
          {total > 0 ? `${from}–${to} of ${total}` : "0 of 0"}
        </span>

        <button
          type="button"
          onClick={handlePrevPage}
          disabled={!hasPrevPage}
          title="Newer"
          className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={!hasNextPage}
          title="Older"
          className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default MailPagination;
