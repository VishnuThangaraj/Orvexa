import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Mail,
  MessageSquare,
  Calendar,
  HardDrive,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useGlobalSearch } from "../hooks/use-home-overview";
import type { GlobalSearchResultItem } from "../types/home.types";
import { cn } from "@/lib/utils";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

type SearchCategory = "all" | "mail" | "chat" | "calendar" | "drive";

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = "",
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useGlobalSearch(query, isOpen);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setActiveCategory("all");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  // Handle click outside & escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectResult = (item: GlobalSearchResultItem) => {
    onClose();
    navigate(item.deepLink);
  };

  const hasAnyResults = searchResults && searchResults.totalHits > 0;
  const isSearchEmpty =
    query.trim().length > 0 && !isLoading && !hasAnyResults;

  const mailCount = searchResults?.results?.mail?.length || 0;
  const chatCount = searchResults?.results?.chat?.length || 0;
  const calCount = searchResults?.results?.calendar?.length || 0;
  const driveCount = searchResults?.results?.drive?.length || 0;
  const totalCount = searchResults?.totalHits || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-white dark:bg-[#1E293B] rounded-[28px] shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <Search size={20} className="text-[#1a73e8] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across Mail, Chat, Calendar, and Drive..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
          />
          {isLoading && (
            <Loader2
              size={18}
              className="animate-spin text-[#1a73e8] shrink-0"
            />
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Category Tabs */}
        {hasAnyResults && (
          <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                activeCategory === "all"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700 font-semibold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <span>All results</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {totalCount}
              </span>
            </button>

            {mailCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory("mail")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                  activeCategory === "mail"
                    ? "bg-[#fce8e6] text-[#c5221f] dark:bg-red-950/60 dark:text-red-300 font-semibold"
                    : "text-slate-500 hover:text-[#ea4335] dark:text-slate-400"
                )}
              >
                <Mail size={13} className="text-[#ea4335]" />
                <span>Mail</span>
                <span className="text-[10px] font-semibold">{mailCount}</span>
              </button>
            )}

            {chatCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory("chat")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                  activeCategory === "chat"
                    ? "bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold"
                    : "text-slate-500 hover:text-[#0f9d58] dark:text-slate-400"
                )}
              >
                <MessageSquare size={13} className="text-[#0f9d58]" />
                <span>Chat</span>
                <span className="text-[10px] font-semibold">{chatCount}</span>
              </button>
            )}

            {calCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory("calendar")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                  activeCategory === "calendar"
                    ? "bg-[#e8f0fe] text-[#1967d2] dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                    : "text-slate-500 hover:text-[#1a73e8] dark:text-slate-400"
                )}
              >
                <Calendar size={13} className="text-[#1a73e8]" />
                <span>Calendar</span>
                <span className="text-[10px] font-semibold">{calCount}</span>
              </button>
            )}

            {driveCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory("drive")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                  activeCategory === "drive"
                    ? "bg-[#fef7e0] text-[#b06000] dark:bg-amber-950/60 dark:text-amber-300 font-semibold"
                    : "text-slate-500 hover:text-[#f9ab00] dark:text-slate-400"
                )}
              >
                <HardDrive size={13} className="text-[#f9ab00]" />
                <span>Drive</span>
                <span className="text-[10px] font-semibold">{driveCount}</span>
              </button>
            )}
          </div>
        )}

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!query.trim() && (
            <div className="py-14 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] dark:bg-blue-950/50 text-[#1a73e8] dark:text-blue-400 flex items-center justify-center mx-auto shadow-2xs">
                <Search size={22} />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Orvexa Federated Search
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Search simultaneously across your Inbox, Chat messages, Calendar events, and Orvexa Drive files.
              </p>
            </div>
          )}

          {isSearchEmpty && (
            <div className="py-14 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                No results found for "{query}"
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Try searching with different keywords or check your spelling.
              </p>
            </div>
          )}

          {hasAnyResults && (
            <>
              {/* Mail Category */}
              {(activeCategory === "all" || activeCategory === "mail") &&
                searchResults.results.mail.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                      <Mail size={13} className="text-[#ea4335]" />
                      <span>Mail ({searchResults.results.mail.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.results.mail.map((item) => (
                        <button
                          key={`mail-${item.id}`}
                          type="button"
                          onClick={() => handleSelectResult(item)}
                          className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all flex items-start gap-3 group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#fce8e6] dark:bg-red-950/60 text-[#ea4335] flex items-center justify-center shrink-0 mt-0.5">
                            <Mail size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#1a73e8] dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </div>
                            {item.snippet && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {item.snippet}
                              </div>
                            )}
                            {item.metadata?.sender && (
                              <div className="text-[10px] text-slate-400 mt-1 font-medium">
                                From: {item.metadata.sender}
                              </div>
                            )}
                          </div>
                          <ArrowUpRight
                            size={16}
                            className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-[#1a73e8] transition-all shrink-0 mt-1"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Chat Category */}
              {(activeCategory === "all" || activeCategory === "chat") &&
                searchResults.results.chat.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-[#0f9d58]" />
                      <span>Chat ({searchResults.results.chat.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.results.chat.map((item) => (
                        <button
                          key={`chat-${item.id}`}
                          type="button"
                          onClick={() => handleSelectResult(item)}
                          className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all flex items-start gap-3 group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#e6f4ea] dark:bg-emerald-950/60 text-[#0f9d58] flex items-center justify-center shrink-0 mt-0.5">
                            <MessageSquare size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#1a73e8] dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </div>
                            {item.snippet && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {item.snippet}
                              </div>
                            )}
                          </div>
                          <ArrowUpRight
                            size={16}
                            className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-[#1a73e8] transition-all shrink-0 mt-1"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Calendar Category */}
              {(activeCategory === "all" || activeCategory === "calendar") &&
                searchResults.results.calendar.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#1a73e8]" />
                      <span>Calendar ({searchResults.results.calendar.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.results.calendar.map((item) => (
                        <button
                          key={`cal-${item.id}`}
                          type="button"
                          onClick={() => handleSelectResult(item)}
                          className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all flex items-start gap-3 group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#e8f0fe] dark:bg-blue-950/60 text-[#1a73e8] flex items-center justify-center shrink-0 mt-0.5">
                            <Calendar size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#1a73e8] dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </div>
                            {item.snippet && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {item.snippet}
                              </div>
                            )}
                          </div>
                          <ArrowUpRight
                            size={16}
                            className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-[#1a73e8] transition-all shrink-0 mt-1"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Drive Category */}
              {(activeCategory === "all" || activeCategory === "drive") &&
                searchResults.results.drive.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                      <HardDrive size={13} className="text-[#f9ab00]" />
                      <span>Drive ({searchResults.results.drive.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.results.drive.map((item) => (
                        <button
                          key={`drive-${item.id}`}
                          type="button"
                          onClick={() => handleSelectResult(item)}
                          className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all flex items-start gap-3 group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#fef7e0] dark:bg-amber-950/60 text-[#f9ab00] flex items-center justify-center shrink-0 mt-0.5">
                            <HardDrive size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#1a73e8] dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </div>
                            {item.snippet && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {item.snippet}
                              </div>
                            )}
                          </div>
                          <ArrowUpRight
                            size={16}
                            className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-[#1a73e8] transition-all shrink-0 mt-1"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
