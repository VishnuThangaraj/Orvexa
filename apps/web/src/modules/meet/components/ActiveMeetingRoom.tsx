import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { ConnectionState, DisconnectReason } from "livekit-client";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useMeetStore } from "../store/meet.store";
import { useMeetingRoom } from "../hooks/useMeetingRoom";
import { useMeetSocket } from "../hooks/useMeetSocket";
import { MeetingRoomCanvas, type MeetLayoutMode } from "./MeetingRoomCanvas";
import { MeetingControlBar } from "./MeetingControlBar";
import { LeaveCallModal } from "./LeaveCallModal";
import { DeviceSettingsModal } from "./DeviceSettingsModal";
import { PeoplePanel } from "./panels/PeoplePanel";
import { HostControlsPanel } from "./panels/HostControlsPanel";
import { MeetingDetailsPanel } from "./panels/MeetingDetailsPanel";
import { InCallChatPanel } from "./panels/InCallChatPanel";
import type { Meeting } from "../types/meet.types";

interface ActiveMeetingRoomProps {
  meeting: Meeting;
  meetingCode: string;
}

export const ActiveMeetingRoom: React.FC<ActiveMeetingRoomProps> = ({
  meeting,
  meetingCode,
}) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const liveKitData = useMeetStore((state) => state.liveKitData);
  const activeSidePanel = useMeetStore((state) => state.activeSidePanel);
  const setActiveSidePanel = useMeetStore((state) => state.setActiveSidePanel);
  const endMeetingForEveryone = useMeetStore((state) => state.endMeetingForEveryone);

  const [layoutMode, setLayoutMode] = useState<MeetLayoutMode>("tiled");
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isHost =
    currentUser?.id === meeting.hostId || liveKitData?.role === "HOST";

  const handleEjectedOrEnded = useCallback(() => {
    navigate(`/meet/${meetingCode}/left`);
  }, [navigate, meetingCode]);

  // Connect to Socket.IO for knock/admit signaling & chat
  const { admit, deny, admitAll, sendChat } = useMeetSocket({
    meetingCode,
    onMeetingEnded: handleEjectedOrEnded,
  });

  // Connect to LiveKit room (or automatic WebRTC P2P fallback when LiveKit is unavailable)
  const {
    connectionState,
    localParticipant,
    remoteParticipants,
    localFallbackTile,
    remoteFallbackPeers,
    activeSpeakers,
    pinnedParticipantId,
    reactions,
    raisedHands,
    isHandRaised,
    error: roomError,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    setPinnedParticipant,
    sendReaction,
    toggleHandRaise,
    leaveMeeting,
    reconnect,
  } = useMeetingRoom({
    url: liveKitData?.url,
    token: liveKitData?.token,
    mode: liveKitData?.mode,
    meetingCode,
    onMeetingEnded: handleEjectedOrEnded,
    onDisconnected: (reason) => {
      // Only navigate away if explicitly kicked or room terminated
      if (
        reason === DisconnectReason.PARTICIPANT_REMOVED ||
        reason === DisconnectReason.ROOM_DELETED ||
        reason === DisconnectReason.ROOM_CLOSED ||
        reason === DisconnectReason.USER_REJECTED
      ) {
        handleEjectedOrEnded();
      }
    },
  });

  // Global Keyboard Shortcuts (Ctrl/Cmd + D for mic, Ctrl/Cmd + E for camera)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        toggleMic();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        toggleCamera();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMic, toggleCamera]);

  // Leave / End handlers
  const handleLeaveClick = () => {
    if (isHost) {
      setIsLeaveModalOpen(true);
    } else {
      leaveMeeting();
      navigate(`/meet/${meetingCode}/left`);
    }
  };

  const handleLeaveOnly = () => {
    setIsLeaveModalOpen(false);
    leaveMeeting();
    navigate(`/meet/${meetingCode}/left`);
  };

  const handleEndForEveryone = async () => {
    setIsLeaveModalOpen(false);
    try {
      await endMeetingForEveryone(meetingCode);
    } catch (e) {
      console.warn("Failed to end meeting on server:", e);
    }
    leaveMeeting();
    navigate(`/meet/${meetingCode}/left`);
  };

  const totalParticipantsCount = localParticipant
    ? 1 + remoteParticipants.length
    : 1 + remoteFallbackPeers.length;

  return (
    <div className="min-h-screen w-full bg-[#202124] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Banner Status Indicator */}
      {connectionState === ConnectionState.Connecting && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/90 border border-neutral-700 text-neutral-200 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-md">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Connecting to video server…</span>
        </div>
      )}

      {connectionState === ConnectionState.Reconnecting && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-amber-950/90 border border-amber-700/80 text-amber-200 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-md">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>Reconnecting to video server…</span>
        </div>
      )}

      {roomError && connectionState === ConnectionState.Disconnected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-950/90 border border-red-700/80 text-red-200 text-xs px-4 py-2 rounded-full flex items-center gap-3 shadow-xl backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="max-w-xs truncate">{roomError}</span>
          <button
            onClick={reconnect}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-full font-medium transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reconnect</span>
          </button>
        </div>
      )}

      {/* Main Display: Canvas + Side Panel */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        <MeetingRoomCanvas
          layoutMode={layoutMode}
          localParticipant={localParticipant}
          remoteParticipants={remoteParticipants}
          localFallbackTile={localFallbackTile}
          remoteFallbackPeers={remoteFallbackPeers}
          activeSpeakers={activeSpeakers}
          pinnedParticipantId={pinnedParticipantId}
          onTogglePin={(id) =>
            setPinnedParticipant(pinnedParticipantId === id ? null : id)
          }
          raisedHands={raisedHands}
          reactions={reactions}
          fallbackStream={localFallbackTile?.stream ?? null}
          fallbackUser={currentUser}
        />

        {/* Side Panels */}
        {activeSidePanel === "people" && (
          <PeoplePanel
            isHost={isHost}
            localParticipant={localParticipant}
            remoteParticipants={remoteParticipants}
            localFallbackTile={localFallbackTile}
            remoteFallbackPeers={remoteFallbackPeers}
            onAdmit={admit}
            onDeny={deny}
            onAdmitAll={admitAll}
            onClose={() => setActiveSidePanel(null)}
          />
        )}

        {activeSidePanel === "host" && isHost && (
          <HostControlsPanel
            meetingCode={meetingCode}
            onClose={() => setActiveSidePanel(null)}
          />
        )}

        {activeSidePanel === "details" && (
          <MeetingDetailsPanel
            meetingCode={meetingCode}
            onClose={() => setActiveSidePanel(null)}
          />
        )}

        {activeSidePanel === "chat" && (
          <InCallChatPanel
            meetingCode={meetingCode}
            isHost={isHost}
            onSendMessage={sendChat}
            onClose={() => setActiveSidePanel(null)}
          />
        )}
      </div>

      {/* Bottom Control Bar */}
      <MeetingControlBar
        meetingCode={meetingCode}
        isHost={isHost}
        participantCount={totalParticipantsCount}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isHandRaised={isHandRaised}
        onToggleHandRaise={toggleHandRaise}
        onSendReaction={sendReaction}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onLeaveCall={handleLeaveClick}
      />

      {/* Leave Call Confirmation Dialog */}
      <LeaveCallModal
        isOpen={isLeaveModalOpen}
        isHost={isHost}
        onClose={() => setIsLeaveModalOpen(false)}
        onLeaveOnly={handleLeaveOnly}
        onEndForEveryone={handleEndForEveryone}
      />

      {/* Device Settings Dialog */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default ActiveMeetingRoom;
