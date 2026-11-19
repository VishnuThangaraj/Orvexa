import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Smile,
  Hand,
  MoreVertical,
  PhoneOff,
  Info,
  Users,
  MessageSquare,
  Shield,
  LayoutGrid,
  Check,
  Settings,
} from "lucide-react";
import { useMeetStore } from "../store/meet.store";
import type { MeetLayoutMode } from "./MeetingRoomCanvas";

interface MeetingControlBarProps {
  meetingCode: string;
  isHost: boolean;
  participantCount: number;
  unreadCount?: number;
  layoutMode: MeetLayoutMode;
  onChangeLayout: (mode: MeetLayoutMode) => void;
  onOpenSettings: () => void;
  isHandRaised: boolean;
  onToggleHandRaise: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeaveCall: () => void;
}

const COMMON_REACTIONS = ["❤️", "👍", "👏", "🎉", "😂", "😮"];

export const MeetingControlBar: React.FC<MeetingControlBarProps> = ({
  meetingCode,
  isHost,
  participantCount,
  unreadCount = 0,
  layoutMode,
  onChangeLayout,
  onOpenSettings,
  isHandRaised,
  onToggleHandRaise,
  onSendReaction,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeaveCall,
}) => {
  const isMicEnabled = useMeetStore((state) => state.isMicEnabled);
  const isCameraEnabled = useMeetStore((state) => state.isCameraEnabled);
  const isScreenSharing = useMeetStore((state) => state.isScreenSharing);
  const activeSidePanel = useMeetStore((state) => state.activeSidePanel);
  const setActiveSidePanel = useMeetStore((state) => state.setActiveSidePanel);

  const [currentTime, setCurrentTime] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Live time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setShowMoreMenu(false);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <footer className="h-20 bg-[#202124] border-t border-neutral-800 px-4 sm:px-6 flex items-center justify-between text-white shrink-0 select-none z-20">
      {/* Left: Meeting Time & Meeting Code */}
      <div className="flex items-center gap-3 w-1/4">
        <span className="text-sm font-medium tracking-tight hidden sm:inline">
          {currentTime}
        </span>
        <span className="text-neutral-500 hidden sm:inline">|</span>
        <span className="text-xs sm:text-sm font-mono text-neutral-300">
          {meetingCode}
        </span>
      </div>

      {/* Center: In-call Control Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 justify-center">
        {/* Microphone Toggle */}
        <button
          type="button"
          onClick={onToggleMic}
          aria-label={isMicEnabled ? "Turn off mic (Ctrl+D)" : "Turn on mic (Ctrl+D)"}
          title={isMicEnabled ? "Turn off mic (Ctrl+D)" : "Turn on mic (Ctrl+D)"}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-xs ${
            isMicEnabled
              ? "bg-[#3c4043] hover:bg-[#4a4e52] text-white"
              : "bg-[#ea4335] hover:bg-[#d93025] text-white"
          }`}
        >
          {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          type="button"
          onClick={onToggleCamera}
          aria-label={isCameraEnabled ? "Turn off camera (Ctrl+E)" : "Turn on camera (Ctrl+E)"}
          title={isCameraEnabled ? "Turn off camera (Ctrl+E)" : "Turn on camera (Ctrl+E)"}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-xs ${
            isCameraEnabled
              ? "bg-[#3c4043] hover:bg-[#4a4e52] text-white"
              : "bg-[#ea4335] hover:bg-[#d93025] text-white"
          }`}
        >
          {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Present Screen Share */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          aria-label={isScreenSharing ? "Stop presenting" : "Present now"}
          title={isScreenSharing ? "Stop presenting" : "Present now"}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-xs ${
            isScreenSharing
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-[#3c4043] hover:bg-[#4a4e52] text-white"
          }`}
        >
          <MonitorUp className="w-5 h-5" />
        </button>

        {/* Emoji Reactions Popover Trigger */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Send a reaction"
            title="Send a reaction"
            className="w-11 h-11 rounded-full bg-[#3c4043] hover:bg-[#4a4e52] text-white flex items-center justify-center transition shadow-xs"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Quick Reaction Tray */}
          {showEmojiPicker && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#303134] border border-neutral-700/80 rounded-full p-1.5 shadow-2xl flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-95">
              {COMMON_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSendReaction(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-9 h-9 rounded-full hover:bg-neutral-700 flex items-center justify-center text-xl hover:scale-125 transition duration-150"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Raise Hand */}
        <button
          type="button"
          onClick={onToggleHandRaise}
          aria-label={isHandRaised ? "Lower hand" : "Raise hand"}
          title={isHandRaised ? "Lower hand" : "Raise hand"}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-xs ${
            isHandRaised
              ? "bg-amber-500 text-neutral-900 hover:bg-amber-400"
              : "bg-[#3c4043] hover:bg-[#4a4e52] text-white"
          }`}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* More Options Dropdown */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            aria-label="More options"
            title="More options"
            className="w-11 h-11 rounded-full bg-[#3c4043] hover:bg-[#4a4e52] text-white flex items-center justify-center transition shadow-xs"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMoreMenu && (
            <div className="absolute bottom-14 right-0 w-56 bg-[#303134] border border-neutral-700 rounded-xl shadow-2xl py-2 z-40 animate-in fade-in">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Change layout
              </div>
              <button
                type="button"
                onClick={() => {
                  onChangeLayout("tiled");
                  setShowMoreMenu(false);
                }}
                className="w-full px-4 py-2 text-sm flex items-center justify-between text-neutral-200 hover:bg-neutral-700 transition"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4 text-neutral-400" />
                  <span>Auto (Tiled)</span>
                </div>
                {layoutMode === "tiled" && <Check className="w-4 h-4 text-blue-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeLayout("spotlight");
                  setShowMoreMenu(false);
                }}
                className="w-full px-4 py-2 text-sm flex items-center justify-between text-neutral-200 hover:bg-neutral-700 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-xs border-2 border-neutral-400" />
                  <span>Spotlight</span>
                </div>
                {layoutMode === "spotlight" && <Check className="w-4 h-4 text-blue-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeLayout("sidebar");
                  setShowMoreMenu(false);
                }}
                className="w-full px-4 py-2 text-sm flex items-center justify-between text-neutral-200 hover:bg-neutral-700 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 flex gap-0.5">
                    <div className="w-2.5 h-full bg-neutral-400 rounded-2xs" />
                    <div className="w-1 h-full bg-neutral-500 rounded-2xs" />
                  </div>
                  <span>Sidebar</span>
                </div>
                {layoutMode === "sidebar" && <Check className="w-4 h-4 text-blue-400" />}
              </button>

              <div className="my-1.5 border-t border-neutral-700" />

              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setShowMoreMenu(false);
                }}
                className="w-full px-4 py-2 text-sm flex items-center gap-2.5 text-neutral-200 hover:bg-neutral-700 transition"
              >
                <Settings className="w-4 h-4 text-neutral-400" />
                <span>Audio & video settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Leave Call (Red Pill Button) */}
        <button
          type="button"
          onClick={onLeaveCall}
          aria-label="Leave call"
          title="Leave call"
          className="h-11 px-6 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white flex items-center justify-center gap-2 transition shadow-md font-medium text-sm ml-2"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Side Panel Toggle Icons */}
      <div className="flex items-center gap-1 sm:gap-2 justify-end w-1/4">
        {/* Meeting Details Button */}
        <button
          type="button"
          onClick={() => setActiveSidePanel("details")}
          aria-label="Meeting details"
          title="Meeting details"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
            activeSidePanel === "details"
              ? "text-blue-400 bg-blue-950/60"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }`}
        >
          <Info className="w-5 h-5" />
        </button>

        {/* People Button (with Count Badge) */}
        <button
          type="button"
          onClick={() => setActiveSidePanel("people")}
          aria-label="Show everyone"
          title="Show everyone"
          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition ${
            activeSidePanel === "people"
              ? "text-blue-400 bg-blue-950/60"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }`}
        >
          <Users className="w-5 h-5" />
          {participantCount > 0 && (
            <span className="absolute top-1 right-1 text-[10px] bg-neutral-700 text-white font-medium rounded-full px-1 min-w-[16px] text-center">
              {participantCount}
            </span>
          )}
        </button>

        {/* In-Call Chat Button (with Unread Badge) */}
        <button
          type="button"
          onClick={() => setActiveSidePanel("chat")}
          aria-label="Chat with everyone"
          title="Chat with everyone"
          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition ${
            activeSidePanel === "chat"
              ? "text-blue-400 bg-blue-950/60"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && activeSidePanel !== "chat" && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
          )}
        </button>

        {/* Host Controls Button (Host / Co-host Only) */}
        {isHost && (
          <button
            type="button"
            onClick={() => setActiveSidePanel("host")}
            aria-label="Host controls"
            title="Host controls"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
              activeSidePanel === "host"
                ? "text-blue-400 bg-blue-950/60"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Shield className="w-5 h-5" />
          </button>
        )}
      </div>
    </footer>
  );
};

export default MeetingControlBar;
