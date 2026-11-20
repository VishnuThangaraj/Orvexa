import { useState, useEffect, useRef, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Participant,
  RemoteParticipant,
  LocalParticipant,
  ConnectionState,
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
  onDisconnected?: () => void;
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
  const url =
    options.url ||
    liveKitData?.url ||
    (typeof window !== "undefined" ? `ws://${window.location.hostname}:7880` : "");

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

  // Connect and handle Room lifecycle
  useEffect(() => {
    if (!token || !url) return;

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
        updateParticipants(newRoom);

        newRoom.localParticipant
          .setMicrophoneEnabled(isMicEnabledRef.current)
          .catch(console.warn);
        newRoom.localParticipant
          .setCameraEnabled(isCameraEnabledRef.current)
          .catch(console.warn);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        if (!isSubscribed) return;
        setConnectionState(ConnectionState.Disconnected);
        updateParticipants(newRoom);
        onDisconnectedRef.current?.();
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

    const connectToRoom = async () => {
      try {
        setRoom(newRoom);
        setConnectionState(ConnectionState.Connecting);
        await newRoom.connect(url, token);
        if (isSubscribed) {
          updateParticipants(newRoom);
        }
      } catch (err: unknown) {
        if (!isSubscribed) return;
        const msg = (err as Error).message || "Failed to connect to video server";
        console.warn("LiveKit connection error:", msg);
        setError(msg);
        setConnectionState(ConnectionState.Disconnected);
      }
    };

    connectToRoom();

    return () => {
      isSubscribed = false;
      newRoom.disconnect();
      roomRef.current = null;
      setRoom(null);
    };
  }, [token, url, updateParticipants]);

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
  };
}
