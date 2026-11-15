import React from "react";
import { X, Users, Pin } from "lucide-react";
import { useChatStore } from "../store/chat.store";
import { useConversationDetails } from "../hooks/use-conversations";
import { usePinnedMessages } from "../hooks/use-messages";
import { cn } from "@/lib/utils";

export const GroupInfoDrawer: React.FC = () => {
  const { isGroupInfoOpen, setIsGroupInfoOpen, activeConversationId } =
    useChatStore();
  const { data: conversation } = useConversationDetails(activeConversationId);
  const { data: pinned = [] } = usePinnedMessages(activeConversationId);

  if (!isGroupInfoOpen || !conversation) return null;

  const initials = conversation.name
    ? conversation.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SP";

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users size={18} className="text-[#0b57d0]" />
          <span>Space Details</span>
        </h3>
        <button
          type="button"
          onClick={() => setIsGroupInfoOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        {/* Space Avatar & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center font-bold text-xl mb-3 shadow-xs">
            {initials}
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {conversation.name}
          </h4>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {conversation.description || "No description provided"}
          </p>
          <span className="mt-2 px-2.5 py-0.5 rounded-full bg-[#d3e3fd] dark:bg-[#004a77]/50 text-[#001d35] dark:text-[#c2e7ff] font-bold text-[10px]">
            {conversation.type} {conversation.visibility ? `• ${conversation.visibility}` : ""}
          </span>
        </div>

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

        {/* Member List */}
        <div>
          <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
            <Users size={12} />
            <span>Members ({conversation.participants.length})</span>
          </h5>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {conversation.participants.map((p) => (
              <div
                key={p.id}
                className="py-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {p.user?.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {p.user?.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {p.user?.email}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    p.memberRole === "OWNER"
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                      : p.memberRole === "ADMIN"
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                  )}
                >
                  {p.memberRole}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoDrawer;
