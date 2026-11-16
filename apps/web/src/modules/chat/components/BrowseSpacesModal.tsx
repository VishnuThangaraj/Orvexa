import React, { useState } from "react";
import { X, Search, Compass, Users, Check, Loader2 } from "lucide-react";
import {
  useDiscoverPublicSpaces,
  useJoinPublicSpace,
} from "../hooks/use-conversations";
import { useChatStore } from "../store/chat.store";

interface BrowseSpacesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrowseSpacesModal: React.FC<BrowseSpacesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useDiscoverPublicSpaces(search || undefined);
  const joinSpace = useJoinPublicSpace();
  const setActiveConversationId = useChatStore(
    (state) => state.setActiveConversationId,
  );

  if (!isOpen) return null;

  const spaces = data?.spaces || [];

  const handleJoin = (spaceId: string) => {
    joinSpace.mutate(spaceId, {
      onSuccess: () => {
        setActiveConversationId(spaceId);
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] flex items-center justify-center font-bold">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Browse Public Spaces
              </h3>
              <p className="text-xs text-slate-500">
                Discover and join public spaces in your organization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-[#f6f8fc] dark:bg-slate-950">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search public spaces by name or topic..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/30 focus:border-[#0b57d0]"
            />
          </div>
        </div>

        {/* Spaces List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-64">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
              <Loader2 size={24} className="animate-spin mb-2 text-[#0b57d0]" />
              <span>Loading public spaces...</span>
            </div>
          ) : spaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs text-center">
              <Compass size={32} className="stroke-[1.5] mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                No public spaces found
              </p>
              <p className="mt-0.5">
                {search
                  ? "Try searching for a different keyword"
                  : "All public spaces will appear here"}
              </p>
            </div>
          ) : (
            spaces.map((space: any) => (
              <div
                key={space.id}
                className="p-3.5 rounded-2xl bg-[#f8fafd] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center font-bold text-sm shrink-0">
                    {space.name?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                      <span>{space.name}</span>
                      <span className="text-[10px] font-normal text-slate-400 flex items-center gap-0.5">
                        <Users size={11} />
                        {space.memberCount}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {space.description || "Public workspace channel"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {space.isMember ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveConversationId(space.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-slate-200"
                    >
                      <Check size={13} className="text-emerald-600 stroke-[2.5]" />
                      <span>Open</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJoin(space.id)}
                      disabled={joinSpace.isPending}
                      className="px-4 py-1.5 rounded-full bg-[#c2e7ff] hover:bg-[#b3dbf7] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {joinSpace.isPending ? "Joining..." : "Join"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseSpacesModal;
