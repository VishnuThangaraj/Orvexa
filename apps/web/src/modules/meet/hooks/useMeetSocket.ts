import { useEffect, useCallback } from "react";
import { socketService } from "@/modules/chat/services/socket.service";
import { useMeetStore } from "../store/meet.store";
import type { MeetingMessage } from "../types/meet.types";

export interface UseMeetSocketOptions {
  meetingCode: string;
  onAdmitted?: () => void;
  onDenied?: () => void;
  onMeetingEnded?: () => void;
}

export function useMeetSocket({
  meetingCode,
  onAdmitted,
  onDenied,
  onMeetingEnded,
}: UseMeetSocketOptions) {
  const addWaitingParticipant = useMeetStore((state) => state.addWaitingParticipant);
  const removeWaitingParticipant = useMeetStore((state) => state.removeWaitingParticipant);
  const setWaitingState = useMeetStore((state) => state.setWaitingState);
  const addMessage = useMeetStore((state) => state.addMessage);

  useEffect(() => {
    if (!meetingCode) return;

    // Ensure socket connection is active
    let socket = socketService.getSocket();
    if (!socket || !socket.connected) {
      socket = socketService.connect();
    }

    if (!socket) return;

    // Join meeting socket room
    socket.emit("meet:join_room", { meetingCode });

    const handleKnockReceived = (data: {
      meetingCode: string;
      userId: string;
      displayName: string;
      avatarUrl?: string;
    }) => {
      if (data.meetingCode === meetingCode) {
        addWaitingParticipant({
          userId: data.userId,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
        });
      }
    };

    const handleKnockCancelled = (data: { meetingCode: string; userId: string }) => {
      if (data.meetingCode === meetingCode) {
        removeWaitingParticipant(data.userId);
      }
    };

    const handleAdmitted = (data: { meetingCode: string }) => {
      if (data.meetingCode === meetingCode) {
        setWaitingState("admitted");
        onAdmitted?.();
      }
    };

    const handleDenied = (data: { meetingCode: string }) => {
      if (data.meetingCode === meetingCode) {
        setWaitingState("denied");
        onDenied?.();
      }
    };

    const handleChatMessage = (msg: unknown) => {
      addMessage(msg as MeetingMessage);
    };

    const handleEnded = (data: { meetingCode: string }) => {
      if (data.meetingCode === meetingCode) {
        onMeetingEnded?.();
      }
    };

    socket.on("meet:knock_received", handleKnockReceived);
    socket.on("meet:knock_cancelled", handleKnockCancelled);
    socket.on("meet:admitted", handleAdmitted);
    socket.on("meet:denied", handleDenied);
    socket.on("meet:chat_message", handleChatMessage);
    socket.on("meet:ended", handleEnded);

    return () => {
      socket?.emit("meet:leave_room", { meetingCode });
      socket?.off("meet:knock_received", handleKnockReceived);
      socket?.off("meet:knock_cancelled", handleKnockCancelled);
      socket?.off("meet:admitted", handleAdmitted);
      socket?.off("meet:denied", handleDenied);
      socket?.off("meet:chat_message", handleChatMessage);
      socket?.off("meet:ended", handleEnded);
    };
  }, [
    meetingCode,
    addWaitingParticipant,
    removeWaitingParticipant,
    setWaitingState,
    addMessage,
    onAdmitted,
    onDenied,
    onMeetingEnded,
  ]);

  const knock = useCallback(
    (displayName?: string) => {
      const socket = socketService.getSocket();
      if (!socket) return;

      socket.emit("meet:knock", { meetingCode, displayName }, (res) => {
        if (res?.success) {
          setWaitingState("knocking");
        }
      });
    },
    [meetingCode, setWaitingState]
  );

  const cancelKnock = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.emit("meet:cancel_knock", { meetingCode });
    setWaitingState("idle");
  }, [meetingCode, setWaitingState]);

  const admit = useCallback(
    (userId: string) => {
      const socket = socketService.getSocket();
      if (!socket) return;

      socket.emit("meet:admit", { meetingCode, userId }, () => {
        removeWaitingParticipant(userId);
      });
    },
    [meetingCode, removeWaitingParticipant]
  );

  const deny = useCallback(
    (userId: string) => {
      const socket = socketService.getSocket();
      if (!socket) return;

      socket.emit("meet:deny", { meetingCode, userId }, () => {
        removeWaitingParticipant(userId);
      });
    },
    [meetingCode, removeWaitingParticipant]
  );

  const admitAll = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.emit("meet:admit_all", { meetingCode }, () => {
      useMeetStore.getState().clearWaitingParticipants();
    });
  }, [meetingCode]);

  const sendChat = useCallback(
    (content: string) => {
      const socket = socketService.getSocket();
      if (!socket) return;

      socket.emit("meet:send_chat", { meetingCode, content });
    },
    [meetingCode]
  );

  return {
    knock,
    cancelKnock,
    admit,
    deny,
    admitAll,
    sendChat,
  };
}
