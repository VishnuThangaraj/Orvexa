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
import { useMeetStore } from "../store/meet.store";

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
  onDisconnected?: (reason?: DisconnectReason) => void;
}

export interface UseMeetingRoomReturn {
  room: Room | null;
  connectionState: ConnectionState;
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
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

function resolveLiveKitUrl(inputUrl?: string): string {
  if (typeof window === "undefined") return inputUrl || "ws://localhost:7880";
  const currentHost = window.location.hostname;
  const isHttps = window.location.protocol === "https:";
  const defaultWsProtocol = isHttps ? "wss:" : "ws:";

  if (!inputUrl) {
    return `${defaultWsProtocol}//${currentHost}:7880`;
  }

  try {
    const parsed = new URL(inputUrl);
    // If server configured localhost/127.0.0.1 but client is visiting via IP or custom domain,
    // point to the current browser host
    if (
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      currentHost !== "localhost" &&
      currentHost !== "127.0.0.1"
    ) {
      parsed.hostname = currentHost;
    }
    if (isHttps && parsed.protocol === "ws:") {
      parsed.protocol = "wss:";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return inputUrl;
  }
}

export function useMeetingRoom(options: UseMeetingRoomOptions = {}): UseMeetingRoomReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const roomRef = useRef<Room | null>(null);

  const liveKitData = useMeetStore((state) => state.liveKitData);
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

  const onDisconnectedRef = useRef(options.onDisconnected);
  const isMicEnabledRef = useRef(isMicEnabled);
  const isCameraEnabledRef = useRef(isCameraEnabled);

  useEffect(() => {
    onDisconnectedRef.current = options.onDisconnected;
  }, [options.onDisconnected]);

  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);

  useEffect(() => {
    isCameraEnabledRef.current = isCameraEnabled;
  }, [isCameraEnabled]);

  const token = options.token || liveKitData?.token;
  const rawUrl = options.url || liveKitData?.url;
  const resolvedUrl = useMemo(() => resolveLiveKitUrl(rawUrl), [rawUrl]);

  // Update participant lists from room
  const updateParticipants = useCallback((activeRoom: Room) => {
    setRemoteParticipants(Array.from(activeRoom.remoteParticipants.values()));
    setLocalParticipant(activeRoom.localParticipant);
  }, []);

  // Send a reaction data message to all participants
  const sendReaction = useCallback((emoji: string) => {
    const activeRoom = roomRef.current;
    const senderName = liveKitData?.participantName || "Participant";
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
    }
  }, [liveKitData?.participantName]);

  // Raise or lower hand
  const toggleHandRaise = useCallback(() => {
    const activeRoom = roomRef.current;
    const participantId = liveKitData?.participantId || "me";
    const senderName = liveKitData?.participantName || "Me";

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
      }

      return updated;
    });
  }, [liveKitData?.participantId, liveKitData?.participantName]);

  const lowerHand = useCallback((participantId: string) => {
    setRaisedHands((prev) => prev.filter((h) => h.participantId !== participantId));
  }, []);

  const isHandRaised = raisedHands.some(
    (h) => h.participantId === (liveKitData?.participantId || "me")
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
    try {
      if (roomRef.current && roomRef.current.state === ConnectionState.Connected) {
        await roomRef.current.localParticipant.setScreenShareEnabled(nextState);
      }
      setIsScreenSharing(nextState);
    } catch (err) {
      console.warn("Failed to toggle screen share:", err);
      setIsScreenSharing(false);
    }
  }, [isScreenSharing, setIsScreenSharing]);

  // Manual reconnect handler
  const reconnect = useCallback(async () => {
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
      setError(msg);
      setConnectionState(ConnectionState.Disconnected);
    }
  }, [token, resolvedUrl, updateParticipants]);

  // Connect and handle Room lifecycle
  useEffect(() => {
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

        // Auto retry up to 2 times with 1.5s delay
        if (attempt < 2 && isSubscribed) {
          console.log(`[LIVEKIT] Retrying connection attempt ${attempt + 1}...`);
          setTimeout(() => {
            if (isSubscribed && newRoom.state !== ConnectionState.Connected) {
              connectToRoom(attempt + 1);
            }
          }, 1500);
          return;
        }

        setError(msg);
        setConnectionState(ConnectionState.Disconnected);
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
  }, [token, resolvedUrl, updateParticipants]);

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
  }, []);

  return {
    room,
    connectionState,
    localParticipant,
    remoteParticipants,
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
