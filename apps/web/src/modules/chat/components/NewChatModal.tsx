import React, { useState } from "react";
import { X, Search, Users, User, Lock, Globe } from "lucide-react";
import { useChatStore } from "../store/chat.store";
import {
  useSearchUsers,
  useCreateDirectConversation,
  useCreateGroupOrChannel,
} from "../hooks/use-conversations";
import { cn } from "@/lib/utils";

export const NewChatModal: React.FC = () => {
  const { isNewChatModalOpen, setIsNewChatModalOpen, setActiveConversationId } =
    useChatStore();
  const [tab, setTab] = useState<"DM" | "SPACE">("DM");

  // Direct Chat search state
  const [userQuery, setUserQuery] = useState("");
  const { data: users = [], isLoading: isLoadingUsers } =
    useSearchUsers(userQuery);

  // Space creation state
  const [spaceName, setSpaceName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"GROUP" | "CHANNEL">("GROUP");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const createDirect = useCreateDirectConversation();
  const createSpace = useCreateGroupOrChannel();

  if (!isNewChatModalOpen) return null;

  const handleStartDm = (recipientId: string) => {
    createDirect.mutate(
      { recipientId },
      {
        onSuccess: (res) => {
          setIsNewChatModalOpen(false);
          setActiveConversationId(res.id);
        },
      },
    );
  };

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;

    createSpace.mutate(
      {
        name: spaceName.trim(),
        description: description.trim() || undefined,
        type,
        visibility: type === "CHANNEL" ? visibility : undefined,
        participantIds: selectedUserIds,
      },
      {
        onSuccess: (res) => {
          setIsNewChatModalOpen(false);
          setActiveConversationId(res.id);
        },
      },
    );
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Start a Conversation
          </h3>
          <button
            type="button"
            onClick={() => setIsNewChatModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("DM")}
            className={cn(
              "flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-2",
              tab === "DM"
                ? "border-[#0b57d0] text-[#0b57d0] dark:text-[#c2e7ff] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            <User size={15} />
            <span>Direct Message</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("SPACE")}
            className={cn(
              "flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-2",
              tab === "SPACE"
                ? "border-[#0b57d0] text-[#0b57d0] dark:text-[#c2e7ff] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            <Users size={15} />
            <span>Create Space</span>
          </button>
        </div>

        {/* Tab 1: Direct Message */}
        {tab === "DM" && (
          <div className="p-4 flex-1 flex flex-col min-h-0">
            <div className="relative mb-3">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search colleagues by name or email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 focus:border-[#0b57d0]/50"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingUsers ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No users found
                </div>
              ) : (
                users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleStartDm(u.id)}
                    disabled={createDirect.isPending}
                    className="w-full p-2.5 flex items-center gap-3 hover:bg-[#d3e3fd]/30 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {u.fullName?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {u.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {u.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Create Space */}
        {tab === "SPACE" && (
          <form
            onSubmit={handleCreateSpace}
            className="p-5 flex-1 flex flex-col space-y-4 overflow-y-auto text-xs"
          >
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Space Name *
              </label>
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder="e.g. Tech Core, Product Design"
                className="w-full px-3 py-2 bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 focus:border-[#0b57d0]/50"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What is this space for?"
                className="w-full px-3 py-2 bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 focus:border-[#0b57d0]/50"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="type"
                  checked={type === "GROUP"}
                  onChange={() => setType("GROUP")}
                  className="accent-[#0b57d0]"
                />
                <span>Group Space</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="type"
                  checked={type === "CHANNEL"}
                  onChange={() => setType("CHANNEL")}
                  className="accent-[#0b57d0]"
                />
                <span>Broadcast Channel</span>
              </label>
            </div>

            {type === "CHANNEL" && (
              <div className="flex gap-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "PUBLIC"}
                    onChange={() => setVisibility("PUBLIC")}
                    className="accent-[#0b57d0]"
                  />
                  <Globe size={14} className="text-slate-500" />
                  <span>Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "PRIVATE"}
                    onChange={() => setVisibility("PRIVATE")}
                    className="accent-[#0b57d0]"
                  />
                  <Lock size={14} className="text-slate-500" />
                  <span>Private</span>
                </label>
              </div>
            )}

            {/* Member selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Add Members ({selectedUserIds.length} selected)
              </label>
              <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="p-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <span className="truncate font-medium">{u.fullName}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleUserSelection(u.id)}
                        className="accent-[#0b57d0]"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={createSpace.isPending || !spaceName.trim()}
              className="w-full py-2.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {createSpace.isPending ? "Creating Space..." : "Create Space"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewChatModal;
