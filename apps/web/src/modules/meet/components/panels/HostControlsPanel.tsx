import React from "react";
import { X, Lock, Users, Monitor, MessageSquare, Smile, VolumeX } from "lucide-react";
import { useMeetStore } from "../../store/meet.store";

interface HostControlsPanelProps {
  meetingCode: string;
  onClose: () => void;
  onMuteAll?: () => void;
}

export const HostControlsPanel: React.FC<HostControlsPanelProps> = ({
  meetingCode,
  onClose,
  onMuteAll,
}) => {
  const currentMeeting = useMeetStore((state) => state.currentMeeting);
  const updateSettings = useMeetStore((state) => state.updateSettings);

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await updateSettings(meetingCode, { [key]: value });
    } catch (err) {
      console.warn("Failed to update host control:", err);
    }
  };

  const isLocked = currentMeeting?.isLocked ?? false;
  const requireApproval = currentMeeting?.requireApproval ?? false;
  const allowScreenShare = currentMeeting?.allowScreenShare ?? true;
  const allowChat = currentMeeting?.allowChat ?? true;
  const allowReactions = currentMeeting?.allowReactions ?? true;

  return (
    <aside className="w-80 sm:w-96 h-full bg-[#202124] border-l border-neutral-800 flex flex-col text-neutral-100 z-30 select-none">
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-800 shrink-0">
        <h3 className="text-base font-medium">Host controls</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          aria-label="Close host controls"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Quick Action: Mute All */}
        {onMuteAll && (
          <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Mute all participants</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Turn off everyone's microphone
              </p>
            </div>
            <button
              type="button"
              onClick={onMuteAll}
              className="px-3.5 py-1.5 bg-neutral-700 hover:bg-red-600 hover:text-white text-neutral-200 text-xs font-medium rounded-full transition flex items-center gap-1.5"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Mute all</span>
            </button>
          </div>
        )}

        {/* Meeting Moderation */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Meeting safety
          </h4>

          {/* Meeting Lock */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-200">Lock meeting</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Block anyone from joining the call
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => handleToggle("isLocked", e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Require Approval */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-200">Require approval to join</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Participants must be admitted by the host
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(e) => handleToggle("requireApproval", e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Participant Permissions */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Let participants
          </h4>

          {/* Share Screen */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
            <div className="flex items-center gap-3">
              <Monitor className="w-4 h-4 text-neutral-400 shrink-0" />
              <p className="text-sm font-medium text-neutral-200">Share their screen</p>
            </div>
            <input
              type="checkbox"
              checked={allowScreenShare}
              onChange={(e) => handleToggle("allowScreenShare", e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Send Chat */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-neutral-400 shrink-0" />
              <p className="text-sm font-medium text-neutral-200">Send chat messages</p>
            </div>
            <input
              type="checkbox"
              checked={allowChat}
              onChange={(e) => handleToggle("allowChat", e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Send Reactions */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
            <div className="flex items-center gap-3">
              <Smile className="w-4 h-4 text-neutral-400 shrink-0" />
              <p className="text-sm font-medium text-neutral-200">Send reactions</p>
            </div>
            <input
              type="checkbox"
              checked={allowReactions}
              onChange={(e) => handleToggle("allowReactions", e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default HostControlsPanel;
