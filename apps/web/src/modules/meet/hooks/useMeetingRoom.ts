import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Room,
  RoomEvent,
  Participant,
  RemoteParticipant,
  LocalParticipant,
  ConnectionState,
  DisconnectReason,
} from "livekit-client";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useMeetStore } from "../store/meet.store";
import { useWebRtcMesh } from "./useWebRtcMesh";
import type { FallbackParticipantTileData } from "../types/meet.types";

export interface ReactionItem {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
}

export interface HandRaiseItem {
  participantId: string;
  senderName: string;
  raisedAt: number;
}

export interface UseMeetingRoomOptions {
  url?: string;
  token?: string;
  mode?: "livekit" | "webrtc";
  meetingCode?: string;
  onDisconnected?: (reason?: DisconnectReason) => void;
  onMeetingEnded?: () => void;
}

export interface UseMeetingRoomReturn {
  room: Room | null;
  connectionState: ConnectionState;
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
  localFallbackTile: FallbackParticipantTileData | null;
  remoteFallbackPeers: FallbackParticipantTileData[];
  isFallbackMode: boolean;
  activeSpeakers: Participant[];
  pinnedParticipantId: string | null;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  reactions: ReactionItem[];
  raisedHands: HandRaiseItem[];
  isHandRaised: boolean;
  error: string | null;
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  setPinnedParticipant: (id: string | null) => void;
  sendReaction: (emoji: string) => void;
  toggleHandRaise: () => void;
  lowerHand: (participantId: string) => void;
  leaveMeeting: () => void;
  reconnect: () => Promise<void>;
}

function resolveLiveKitUrl(inputUrl?: string): string | null {
  if (!inputUrl || !inputUrl.trim()) return null;
  if (typeof window === "undefined") return inputUrl;
  const currentHost = window.location.hostname;
  const isHttps = window.location.protocol === "https:";

  try {
    const parsed = new URL(inputUrl);
    const pointsToLocal =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const isBrowserLocal =
      currentHost === "localhost" || currentHost === "127.0.0.1";
    // Never rewrite a localhost URL onto a remote deployment host (e.g. Vercel :7880)
    if (pointsToLocal && !isBrowserLocal) {
      return null;
    }
    if (isHttps && parsed.protocol === "ws:") {
      parsed.protocol = "wss:";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function useMeetingRoom(options: UseMeetingRoomOptions = {}): UseMeetingRoomReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const roomRef = useRef<Room | null>(null);

  const liveKitData = useMeetStore((state) => state.liveKitData);
  const currentUser = useAuthStore((state) => state.user);
  const isMicEnabled = useMeetStore((state) => state.isMicEnabled);
  const isCameraEnabled = useMeetStore((state) => state.isCameraEnabled);
  const isScreenSharing = useMeetStore((state) => state.isScreenSharing);
  const setMicEnabled = useMeetStore((state) => state.setMicEnabled);
  const setCameraEnabled = useMeetStore((state) => state.setCameraEnabled);
  const setIsScreenSharing = useMeetStore((state) => state.setIsScreenSharing);

  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [raisedHands, setRaisedHands] = useState<HandRaiseItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fallbackToWebRtc, setFallbackToWebRtc] = useState<boolean>(false);

  const onDisconnectedRef = useRef(options.onDisconnected);
  const onMeetingEndedRef = useRef(options.onMeetingEnded);
  const isMicEnabledRef = useRef(isMicEnabled);
  const isCameraEnabledRef = useRef(isCameraEnabled);

  useEffect(() => {
    onDisconnectedRef.current = options.onDisconnected;
    onMeetingEndedRef.current = options.onMeetingEnded;
  }, [options.onDisconnected, options.onMeetingEnded]);

  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);

  useEffect(() => {
    isCameraEnabledRef.current = isCameraEnabled;
  }, [isCameraEnabled]);

  const token = options.token || liveKitData?.token;
  const rawUrl = options.url ?? liveKitData?.url;
  const configuredMode = options.mode || liveKitData?.mode;
  const effectiveMeetingCode = options.meetingCode || liveKitData?.meetingCode;
  const resolvedUrl = useMemo(() => resolveLiveKitUrl(rawUrl), [rawUrl]);
  const isFallbackMode =
    configuredMode === "webrtc" || !resolvedUrl || fallbackToWebRtc;

  const {
    localFallbackTile,
    remoteFallbackPeers,
    sendWebRtcReaction,
    sendWebRtcHandRaise,
    toggleWebRtcScreenShare,
    leaveWebRtc,
  } = useWebRtcMesh({
    enabled: Boolean(isFallbackMode && (token || effectiveMeetingCode)),
    meetingCode: effectiveMeetingCode,
    myUserId: liveKitData?.participantId || (currentUser?.id ? String(currentUser.id) : undefined),
    myName: liveKitData?.participantName || currentUser?.fullName || "You",
    myAvatarUrl: currentUser?.profileImage?.secureUrl || null,
    myRole: liveKitData?.role,
    onReaction: (reactionItem) => {
      setReactions((prev) => [...prev, reactionItem]);
    },
    onHandRaiseUpdate: (data) => {
      setRaisedHands((prev) => {
        if (data.isRaised) {
          if (prev.some((h) => h.participantId === data.participantId)) return prev;
          return [
            ...prev,
            { participantId: data.participantId, senderName: data.senderName, raisedAt: Date.now() },
          ];
        }
        return prev.filter((h) => h.participantId !== data.participantId);
      });
    },
    onMeetingEnded: () => onMeetingEndedRef.current?.(),
  });

  // Update participant lists from room
  const updateParticipants = useCallback((activeRoom: Room) => {
    setRemoteParticipants(Array.from(activeRoom.remoteParticipants.values()));
    setLocalParticipant(activeRoom.localParticipant);
  }, []);

  // Send a reaction data message to all participants
  const sendReaction = useCallback((emoji: string) => {
    const activeRoom = roomRef.current;
    const senderName = liveKitData?.participantName || currentUser?.fullName || "Participant";
    const reactionItem: ReactionItem = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      senderName,
      timestamp: Date.now(),
    };

    setReactions((prev) => [...prev, reactionItem]);

    if (activeRoom && activeRoom.state === ConnectionState.Connected) {
      try {
        const payload = JSON.stringify({
          type: "reaction",
          emoji,
          senderName,
        });
        const encoder = new TextEncoder();
        activeRoom.localParticipant.publishData(encoder.encode(payload), { reliable: true });
      } catch (e) {
        console.warn("Failed to publish reaction:", e);
      }
    } else if (isFallbackMode) {
      void sendWebRtcReaction(emoji);
    }
  }, [liveKitData?.participantName, currentUser?.fullName, isFallbackMode, sendWebRtcReaction]);

  // Raise or lower hand
  const toggleHandRaise = useCallback(() => {
    const activeRoom = roomRef.current;
    const participantId =
      liveKitData?.participantId || (currentUser?.id ? String(currentUser.id) : "me");
    const senderName = liveKitData?.participantName || currentUser?.fullName || "Me";

    setRaisedHands((prev) => {
      const alreadyRaised = prev.some((h) => h.participantId === participantId);
      const updated = alreadyRaised
        ? prev.filter((h) => h.participantId !== participantId)
        : [...prev, { participantId, senderName, raisedAt: Date.now() }];

      if (activeRoom && activeRoom.state === ConnectionState.Connected) {
        try {
          const payload = JSON.stringify({
            type: "hand_raise",
            participantId,
            senderName,
            isRaised: !alreadyRaised,
          });
          const encoder = new TextEncoder();
          activeRoom.localParticipant.publishData(encoder.encode(payload), { reliable: true });
        } catch (e) {
          console.warn("Failed to publish hand raise:", e);
        }
      } else if (isFallbackMode) {
        void sendWebRtcHandRaise(!alreadyRaised);
      }

      return updated;
    });
  }, [
    liveKitData?.participantId,
    liveKitData?.participantName,
    currentUser?.id,
    currentUser?.fullName,
    isFallbackMode,
    sendWebRtcHandRaise,
  ]);

  const lowerHand = useCallback((participantId: string) => {
    setRaisedHands((prev) => prev.filter((h) => h.participantId !== participantId));
  }, []);

  const isHandRaised = raisedHands.some(
    (h) =>
      h.participantId ===
      (liveKitData?.participantId || (currentUser?.id ? String(currentUser.id) : "me"))
  );

  // Toggle mic
  const toggleMic = useCallback(async () => {
    const nextState = !isMicEnabled;
    setMicEnabled(nextState);
    if (roomRef.current && roomRef.current.state === ConnectionState.Connected) {
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(nextState);
      } catch (err) {
        console.warn("Failed to toggle microphone track:", err);
      }
    }
  }, [isMicEnabled, setMicEnabled]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    const nextState = !isCameraEnabled;
    setCameraEnabled(nextState);
    if (roomRef.current && roomRef.current.state === ConnectionState.Connected) {
      try {
        await roomRef.current.localParticipant.setCameraEnabled(nextState);
      } catch (err) {
        console.warn("Failed to toggle camera track:", err);
      }
    }
  }, [isCameraEnabled, setCameraEnabled]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    const nextState = !isScreenSharing;
    if (isFallbackMode) {
      await toggleWebRtcScreenShare();
      return;
    }
    try {
      if (roomRef.current && roomRef.current.state === ConnectionState.Connected) {
        await roomRef.current.localParticipant.setScreenShareEnabled(nextState);
      }
      setIsScreenSharing(nextState);
    } catch (err) {
      console.warn("Failed to toggle screen share:", err);
      setIsScreenSharing(false);
    }
  }, [isFallbackMode, isScreenSharing, setIsScreenSharing, toggleWebRtcScreenShare]);

  // Manual reconnect handler
  const reconnect = useCallback(async () => {
    if (isFallbackMode) {
      setError(null);
      setConnectionState(ConnectionState.Connected);
      return;
    }
    if (!token || !resolvedUrl) return;
    setError(null);
    setConnectionState(ConnectionState.Connecting);

    try {
      let currentRoom = roomRef.current;
      if (!currentRoom) {
        currentRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: { width: 1280, height: 720, frameRate: 30 },
          },
        });
        roomRef.current = currentRoom;
        setRoom(currentRoom);
      } else if (currentRoom.state === ConnectionState.Connected) {
        await currentRoom.disconnect();
      }

      await currentRoom.connect(resolvedUrl, token);
      setConnectionState(ConnectionState.Connected);
      updateParticipants(currentRoom);
      setError(null);
    } catch (err: unknown) {
      const msg = (err as Error).message || "Failed to reconnect to video server";
      console.warn("LiveKit manual reconnect error:", msg);
      setError(null);
      setFallbackToWebRtc(true);
      setConnectionState(ConnectionState.Connected);
    }
  }, [isFallbackMode, token, resolvedUrl, updateParticipants]);

  // Connect and handle Room lifecycle (LiveKit when configured; immediate WebRTC P2P when not)
  useEffect(() => {
    if (isFallbackMode) {
      setError(null);
      setConnectionState(ConnectionState.Connected);
      return;
    }
    if (!token || !resolvedUrl) return;

    let isSubscribed = true;
    const newRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: { width: 1280, height: 720, frameRate: 30 },
      },
    });

    roomRef.current = newRoom;

    const setupEventListeners = () => {
      newRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (!isSubscribed) return;
        setConnectionState(state);
      });

      newRoom.on(RoomEvent.Connected, () => {
        if (!isSubscribed) return;
        setConnectionState(ConnectionState.Connected);
        setError(null);
        updateParticipants(newRoom);

        // Publish mic and camera tracks based on pre-join state
        if (isMicEnabledRef.current) {
          newRoom.localParticipant
            .setMicrophoneEnabled(true)
            .catch((err) => console.warn("Failed to enable initial mic:", err));
        }
        if (isCameraEnabledRef.current) {
          newRoom.localParticipant
            .setCameraEnabled(true)
            .catch((err) => console.warn("Failed to enable initial camera:", err));
        }
      });

      newRoom.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
        if (!isSubscribed) return;
        setConnectionState(ConnectionState.Disconnected);
        updateParticipants(newRoom);

        console.log("[LIVEKIT] Room disconnected with reason:", reason);

        // Only navigate away if the user was explicitly ejected or the room was ended by the host/server.
        // Never navigate away on connection glitches, initial connect errors, or strict-mode unmounts!
        const shouldEject =
          reason === DisconnectReason.PARTICIPANT_REMOVED ||
          reason === DisconnectReason.ROOM_DELETED ||
          reason === DisconnectReason.ROOM_CLOSED ||
          reason === DisconnectReason.USER_REJECTED;

        if (shouldEject) {
          onDisconnectedRef.current?.(reason);
        } else {
          setError(
            reason === DisconnectReason.DUPLICATE_IDENTITY
              ? "Session ended: this account joined from another window or tab."
              : "Disconnected from video server. Click retry to reconnect."
          );
        }
      });

      newRoom.on(RoomEvent.ParticipantConnected, () => {
        if (!isSubscribed) return;
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        if (!isSubscribed) return;
        updateParticipants(newRoom);
        setRaisedHands((prev) => prev.filter((h) => h.participantId !== participant.identity));
        setPinnedParticipantId((prev) => (prev === participant.identity ? null : prev));
      });

      newRoom.on(RoomEvent.LocalTrackPublished, () => {
        if (!isSubscribed) return;
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.LocalTrackUnpublished, () => {
        if (!isSubscribed) return;
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackSubscribed, () => {
        if (!isSubscribed) return;
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, () => {
        if (!isSubscribed) return;
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackMuted, () => {
        if (!isSubscribed) return;
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackUnmuted, () => {
        if (!isSubscribed) return;
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        if (!isSubscribed) return;
        setActiveSpeakers(speakers);
      });

      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        if (!isSubscribed) return;
        try {
          const str = new TextDecoder().decode(payload);
          const data = JSON.parse(str);

          if (data.type === "reaction") {
            const reactionItem: ReactionItem = {
              id: `${Date.now()}-${Math.random()}`,
              emoji: data.emoji,
              senderName: data.senderName || participant?.name || "Participant",
              timestamp: Date.now(),
            };
            setReactions((prev) => [...prev, reactionItem]);
          } else if (data.type === "hand_raise") {
            const pId = data.participantId || participant?.identity;
            const pName = data.senderName || participant?.name || "Participant";
            setRaisedHands((prev) => {
              if (data.isRaised) {
                if (prev.some((h) => h.participantId === pId)) return prev;
                return [...prev, { participantId: pId, senderName: pName, raisedAt: Date.now() }];
              } else {
                return prev.filter((h) => h.participantId !== pId);
              }
            });
          }
        } catch (e) {
          console.warn("Failed to parse LiveKit data message:", e);
        }
      });
    };

    setupEventListeners();

    const connectToRoom = async (attempt = 0) => {
      if (!isSubscribed) return;
      try {
        setRoom(newRoom);
        setConnectionState(ConnectionState.Connecting);
        setError(null);
        await newRoom.connect(resolvedUrl, token);
        if (isSubscribed) {
          setConnectionState(ConnectionState.Connected);
          updateParticipants(newRoom);
          setError(null);
        }
      } catch (err: unknown) {
        if (!isSubscribed) return;
        const msg = (err as Error).message || "Failed to connect to video server";
        console.warn("LiveKit connection attempt failed:", msg);

        // Switch to WebRTC P2P fallback if LiveKit server is unreachable
        if (attempt < 1 && isSubscribed) {
          console.log(`[LIVEKIT] Retrying connection attempt ${attempt + 1}...`);
          setTimeout(() => {
            if (isSubscribed && newRoom.state !== ConnectionState.Connected) {
              connectToRoom(attempt + 1);
            }
          }, 1500);
          return;
        }

        console.warn("[LIVEKIT] Falling back to WebRTC peer-to-peer mode after signal failure:", msg);
        setError(null);
        setFallbackToWebRtc(true);
        setConnectionState(ConnectionState.Connected);
      }
    };

    connectToRoom();

    return () => {
      isSubscribed = false;
      try {
        newRoom.removeAllListeners();
        newRoom.disconnect();
      } catch (e) {
        console.warn("Cleanup room error:", e);
      }
      if (roomRef.current === newRoom) {
        roomRef.current = null;
      }
      setRoom(null);
    };
  }, [isFallbackMode, token, resolvedUrl, updateParticipants]);

  // Clean old reactions after 4 seconds
  useEffect(() => {
    if (reactions.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setReactions((prev) => prev.filter((r) => now - r.timestamp < 4000));
    }, 1000);
    return () => clearTimeout(timer);
  }, [reactions]);

  const leaveMeeting = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    if (isFallbackMode) {
      leaveWebRtc();
    }
  }, [isFallbackMode, leaveWebRtc]);

  return {
    room,
    connectionState,
    localParticipant,
    remoteParticipants,
    localFallbackTile,
    remoteFallbackPeers,
    isFallbackMode,
    activeSpeakers,
    pinnedParticipantId,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    reactions,
    raisedHands,
    isHandRaised,
    error,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    setPinnedParticipant: setPinnedParticipantId,
    sendReaction,
    toggleHandRaise,
    lowerHand,
    leaveMeeting,
    reconnect,
  };
}
