import React, { useState } from "react";
import {
  X,
  Users,
  Pin,
  Edit2,
  Check,
  LogOut,
  Archive,
  UserMinus,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useChatStore } from "../store/chat.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  useConversationDetails,
  useUpdateConversation,
  useUpdateParticipantRole,
  useRemoveParticipant,
} from "../hooks/use-conversations";
import { usePinnedMessages } from "../hooks/use-messages";
import { cn } from "@/lib/utils";

export const GroupInfoDrawer: React.FC = () => {
  const {
    isGroupInfoOpen,
    setIsGroupInfoOpen,
    activeConversationId,
    setActiveConversationId,
  } = useChatStore();
  const currentUser = useAuthStore((state) => state.user);

  const { data: conversation } = useConversationDetails(activeConversationId);
  const { data: pinned = [] } = usePinnedMessages(activeConversationId);

  const updateConversation = useUpdateConversation(activeConversationId || "");
  const updateRole = useUpdateParticipantRole(activeConversationId || "");
  const removeParticipant = useRemoveParticipant(activeConversationId || "");

  // Editing state for Space Settings
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  if (!isGroupInfoOpen || !conversation) return null;

  const currentParticipant = conversation.participants.find(
    (p) => String(p.userId) === String(currentUser?.id),
  );
  const isOwner = currentParticipant?.memberRole === "OWNER";
  const isManager = isOwner || currentParticipant?.memberRole === "ADMIN";

  const handleStartEdit = () => {
    setName(conversation.name || "");
    setDescription(conversation.description || "");
    setVisibility((conversation.visibility as "PUBLIC" | "PRIVATE") || "PUBLIC");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!name.trim()) return;
    updateConversation.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleToggleArchive = () => {
    const nextArchived = !conversation.archivedAt;
    const confirmMsg = nextArchived
      ? "Are you sure you want to archive this space?"
      : "Unarchive this space?";
    if (!window.confirm(confirmMsg)) return;

    updateConversation.mutate({
      isArchived: nextArchived,
    });
  };

  const handleLeaveSpace = () => {
    if (!window.confirm("Are you sure you want to leave this space?")) return;
    removeParticipant.mutate(String(currentUser?.id), {
      onSuccess: () => {
        setIsGroupInfoOpen(false);
        setActiveConversationId(null);
      },
    });
  };

  const handleRemoveMember = (userId: string, memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from this space?`)) return;
    removeParticipant.mutate(userId);
  };

  const handleToggleRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
    updateRole.mutate({ userId, memberRole: newRole });
  };

  const initials = conversation.name
    ? conversation.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SP";

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-88 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users size={18} className="text-[#0b57d0]" />
          <span>Space Details</span>
        </h3>
        <button
          type="button"
          onClick={() => setIsGroupInfoOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        {/* Space Avatar & Title / Edit Form */}
        {isEditing ? (
          <div className="p-3 bg-[#f0f4f9] dark:bg-slate-800 rounded-2xl space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Space Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
                }
                className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
              >
                <option value="PUBLIC">PUBLIC (Discoverable & joinable)</option>
                <option value="PRIVATE">PRIVATE (Invite only)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!name.trim() || updateConversation.isPending}
                className="px-3 py-1 bg-[#0b57d0] text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Check size={14} />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center relative group">
            {isManager && (
              <button
                type="button"
                onClick={handleStartEdit}
                title="Edit space details"
                className="absolute top-0 right-0 p-1.5 rounded-lg text-slate-400 hover:text-[#0b57d0] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Edit2 size={15} />
              </button>
            )}
            <div className="w-16 h-16 rounded-2xl bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center font-bold text-xl mb-3 shadow-xs">
              {initials}
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {conversation.name}
            </h4>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {conversation.description || "No description provided"}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#d3e3fd] dark:bg-[#004a77]/50 text-[#001d35] dark:text-[#c2e7ff] font-bold text-[10px]">
                {conversation.type} • {conversation.visibility || "PRIVATE"}
              </span>
              {conversation.archivedAt && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px]">
                  Archived
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pinned Messages */}
        {pinned.length > 0 && (
          <div>
            <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
              <Pin size={12} className="text-[#0b57d0] fill-[#0b57d0]" />
              <span>Pinned Messages ({pinned.length})</span>
            </h5>
            <div className="space-y-2">
              {pinned.map((item: any) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-[#eaf1fb] dark:bg-[#004a77]/30 border border-[#c2e7ff] dark:border-[#004a77] text-slate-700 dark:text-slate-300"
                >
                  <p className="truncate font-medium">{item.message?.content}</p>
                  <span className="text-[10px] text-slate-400">
                    By {item.pinnedByUser?.fullName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member List & Role Controls */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Users size={12} />
              <span>Members ({conversation.participants.length})</span>
            </h5>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {conversation.participants.map((p) => {
              const isTargetOwner = p.memberRole === "OWNER";
              const isTargetSelf = String(p.userId) === String(currentUser?.id);

              return (
                <div
                  key={p.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {p.user?.fullName?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {p.user?.fullName} {isTargetSelf && "(You)"}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        @{p.user?.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        p.memberRole === "OWNER"
                          ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                          : p.memberRole === "ADMIN"
                            ? "bg-[#d3e3fd] text-[#041e49] dark:bg-[#00385c] dark:text-[#d3e3fd]"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                      )}
                    >
                      {p.memberRole}
                    </span>

                    {/* Role Promotion/Demotion: Owner only */}
                    {isOwner && !isTargetOwner && (
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleRole(String(p.userId), p.memberRole)
                        }
                        title={
                          p.memberRole === "ADMIN"
                            ? "Demote to Member"
                            : "Promote to Admin"
                        }
                        className="p-1 text-slate-400 hover:text-[#0b57d0] hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                      >
                        {p.memberRole === "ADMIN" ? (
                          <ShieldAlert size={14} />
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                      </button>
                    )}

                    {/* Member Removal: Manager can remove members; Owner cannot be removed */}
                    {isManager &&
                      !isTargetOwner &&
                      !isTargetSelf &&
                      (isOwner || p.memberRole === "MEMBER") && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(String(p.userId), p.user?.fullName)
                          }
                          title="Remove from space"
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Space Actions (Archive / Leave) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {isManager && (
            <button
              type="button"
              onClick={handleToggleArchive}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 font-semibold text-xs cursor-pointer transition-colors"
            >
              <Archive size={15} />
              <span>
                {conversation.archivedAt ? "Unarchive Space" : "Archive Space"}
              </span>
            </button>
          )}

          {!isOwner && (
            <button
              type="button"
              onClick={handleLeaveSpace}
              className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center gap-2 font-semibold text-xs cursor-pointer transition-colors"
            >
              <LogOut size={15} />
              <span>Leave Space</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoDrawer;
