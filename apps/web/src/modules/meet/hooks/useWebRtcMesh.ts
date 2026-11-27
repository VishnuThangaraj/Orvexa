import { useEffect, useRef, useState, useCallback } from "react";
import { socketService } from "@/modules/chat/services/socket.service";
import meetApi from "../api/meet.api";
import { useMeetStore } from "../store/meet.store";
import { useMediaStream } from "./useMediaStream";
import type {
  FallbackParticipantTileData,
  MeetingRole,
  MeetSignalItem,
  MeetSignalKind,
} from "../types/meet.types";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function compareIds(a: string, b: string): number {
  try {
    const ba = BigInt(a);
    const bb = BigInt(b);
    return ba < bb ? -1 : ba > bb ? 1 : 0;
  } catch {
    return a.localeCompare(b);
  }
}

interface PeerStateMeta {
  name: string;
  avatarUrl: string | null;
  role?: MeetingRole;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
}

export interface UseWebRtcMeshOptions {
  enabled: boolean;
  meetingCode?: string;
  myUserId?: string;
  myName: string;
  myAvatarUrl?: string | null;
  myRole?: MeetingRole;
  onReaction?: (reaction: { id: string; emoji: string; senderName: string; timestamp: number }) => void;
  onHandRaiseUpdate?: (item: { participantId: string; senderName: string; isRaised: boolean }) => void;
  onMeetingEnded?: () => void;
}

export function useWebRtcMesh({
  enabled,
  meetingCode,
  myUserId,
  myName,
  myAvatarUrl,
  myRole,
  onReaction,
  onHandRaiseUpdate,
  onMeetingEnded,
}: UseWebRtcMeshOptions) {
  const isMicEnabled = useMeetStore((s) => s.isMicEnabled);
  const isCameraEnabled = useMeetStore((s) => s.isCameraEnabled);
  const isScreenSharing = useMeetStore((s) => s.isScreenSharing);
  const setIsScreenSharing = useMeetStore((s) => s.setIsScreenSharing);
  const setWaitingParticipants = useMeetStore((s) => s.setWaitingParticipants);

  const {
    stream: localCameraStream,
    stopStream: stopLocalCameraStream,
  } = useMediaStream({ autoStart: enabled });

  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localCameraStreamRef = useRef<MediaStream | null>(null);

  const [remotePeers, setRemotePeers] = useState<FallbackParticipantTileData[]>([]);

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const peerMetaRef = useRef<Map<string, PeerStateMeta>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const lastSignalIdRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  const onReactionRef = useRef(onReaction);
  const onHandRaiseUpdateRef = useRef(onHandRaiseUpdate);
  const onMeetingEndedRef = useRef(onMeetingEnded);
  useEffect(() => {
    onReactionRef.current = onReaction;
    onHandRaiseUpdateRef.current = onHandRaiseUpdate;
    onMeetingEndedRef.current = onMeetingEnded;
  }, [onReaction, onHandRaiseUpdate, onMeetingEnded]);

  useEffect(() => {
    localCameraStreamRef.current = localCameraStream;
  }, [localCameraStream]);

  const rebuildRemotePeersState = useCallback(() => {
    const next: FallbackParticipantTileData[] = [];
    peerMetaRef.current.forEach((meta, userId) => {
      next.push({
        id: userId,
        name: meta.name,
        avatarUrl: meta.avatarUrl,
        role: meta.role,
        isLocal: false,
        stream: remoteStreamsRef.current.get(userId) || null,
        isMicEnabled: meta.isMicEnabled,
        isCameraEnabled: meta.isCameraEnabled,
        isScreenSharing: meta.isScreenSharing,
      });
    });
    setRemotePeers(next);
  }, []);

  const sendSignal = useCallback(
    async (kind: MeetSignalKind, payload: Record<string, unknown>, toUserId?: string | null) => {
      if (!meetingCode) return;
      try {
        await meetApi.postSignal(meetingCode, { kind, payload, toUserId });
      } catch (err) {
        console.warn(`[WEBRTC] Failed to send ${kind} signal:`, err);
      }
    },
    [meetingCode],
  );

  const getActiveOutgoingTracks = useCallback((): {
    audioTrack: MediaStreamTrack | null;
    videoTrack: MediaStreamTrack | null;
    targetStream: MediaStream | null;
  } => {
    const camStream = localCameraStreamRef.current;
    const scrStream = screenStreamRef.current;
    const audioTrack = camStream?.getAudioTracks()[0] || null;
    const videoTrack = scrStream?.getVideoTracks()[0] || camStream?.getVideoTracks()[0] || null;
    const targetStream = scrStream || camStream || null;
    return { audioTrack, videoTrack, targetStream };
  }, []);

  const syncLocalTracksToPeer = useCallback(
    async (pc: RTCPeerConnection) => {
      const { audioTrack, videoTrack, targetStream } = getActiveOutgoingTracks();
      const senders = pc.getSenders();

      const audioSender = senders.find((s) => s.track?.kind === "audio");
      if (audioSender) {
        await audioSender.replaceTrack(audioTrack).catch(() => {});
      } else if (audioTrack && localCameraStreamRef.current) {
        pc.addTrack(audioTrack, localCameraStreamRef.current);
      }

      const videoSender = senders.find((s) => s.track?.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(videoTrack).catch(() => {});
      } else if (videoTrack && targetStream) {
        pc.addTrack(videoTrack, targetStream);
      }
    },
    [getActiveOutgoingTracks],
  );

  const closePeer = useCallback(
    (peerId: string, keepMeta = false) => {
      const pc = peersRef.current.get(peerId);
      if (pc) {
        try {
          pc.onicecandidate = null;
          pc.ontrack = null;
          pc.onconnectionstatechange = null;
          pc.close();
        } catch {
          // ignore
        }
        peersRef.current.delete(peerId);
      }
      pendingIceRef.current.delete(peerId);
      remoteStreamsRef.current.delete(peerId);
      if (!keepMeta) {
        peerMetaRef.current.delete(peerId);
      }
      rebuildRemotePeersState();
    },
    [rebuildRemotePeersState],
  );

  const createPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peersRef.current.set(peerId, pc);

      const { audioTrack, videoTrack, targetStream } = getActiveOutgoingTracks();
      if (audioTrack && localCameraStreamRef.current) {
        pc.addTrack(audioTrack, localCameraStreamRef.current);
      }
      if (videoTrack && targetStream) {
        pc.addTrack(videoTrack, targetStream);
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          void sendSignal("ice", { candidate: event.candidate.toJSON() }, peerId);
        }
      };

      pc.ontrack = (event) => {
        const stream =
          event.streams && event.streams[0]
            ? event.streams[0]
            : (() => {
                const current = remoteStreamsRef.current.get(peerId) || new MediaStream();
                current.addTrack(event.track);
                return current;
              })();

        remoteStreamsRef.current.set(peerId, stream);
        if (!peerMetaRef.current.has(peerId)) {
          peerMetaRef.current.set(peerId, {
            name: "Participant",
            avatarUrl: null,
            isMicEnabled: true,
            isCameraEnabled: true,
            isScreenSharing: false,
          });
        }
        rebuildRemotePeersState();
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          closePeer(peerId, true);
        }
      };

      return pc;
    },
    [closePeer, getActiveOutgoingTracks, rebuildRemotePeersState, sendSignal],
  );

  const initiateOfferToPeer = useCallback(
    async (peerId: string) => {
      const pc = createPeerConnection(peerId);
      try {
        await syncLocalTracksToPeer(pc);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        await sendSignal("offer", { sdp: pc.localDescription?.toJSON() || offer }, peerId);
      } catch (err) {
        console.warn(`[WEBRTC] Offer creation failed for ${peerId}:`, err);
      }
    },
    [createPeerConnection, sendSignal, syncLocalTracksToPeer],
  );

  const handleSignal = useCallback(
    async (signal: MeetSignalItem) => {
      if (!enabled || !myUserId) return;
      if (signal.fromUserId === myUserId) return;
      if (signal.toUserId && signal.toUserId !== myUserId) return;
      if (processedSignalIdsRef.current.has(signal.id)) return;
      processedSignalIdsRef.current.add(signal.id);

      const fromId = signal.fromUserId;

      if (!peerMetaRef.current.has(fromId) && signal.kind !== "leave") {
        peerMetaRef.current.set(fromId, {
          name: signal.fromName || "Participant",
          avatarUrl: signal.avatarUrl || null,
          isMicEnabled: true,
          isCameraEnabled: true,
          isScreenSharing: false,
        });
        rebuildRemotePeersState();
      }

      if (signal.kind === "leave") {
        closePeer(fromId, false);
        return;
      }

      if (signal.kind === "media_state") {
        const existing = peerMetaRef.current.get(fromId) || {
          name: signal.fromName || "Participant",
          avatarUrl: signal.avatarUrl || null,
          isMicEnabled: true,
          isCameraEnabled: true,
          isScreenSharing: false,
        };
        peerMetaRef.current.set(fromId, {
          ...existing,
          name: signal.fromName || existing.name,
          avatarUrl: signal.avatarUrl ?? existing.avatarUrl,
          isMicEnabled:
            typeof signal.payload.isMicEnabled === "boolean"
              ? signal.payload.isMicEnabled
              : existing.isMicEnabled,
          isCameraEnabled:
            typeof signal.payload.isCameraEnabled === "boolean"
              ? signal.payload.isCameraEnabled
              : existing.isCameraEnabled,
          isScreenSharing:
            typeof signal.payload.isScreenSharing === "boolean"
              ? signal.payload.isScreenSharing
              : existing.isScreenSharing,
        });
        rebuildRemotePeersState();
        return;
      }

      if (signal.kind === "reaction") {
        const emoji = typeof signal.payload.emoji === "string" ? signal.payload.emoji : null;
        if (emoji) {
          onReactionRef.current?.({
            id: `rtc-${signal.id}`,
            emoji,
            senderName: signal.fromName || "Participant",
            timestamp: Date.now(),
          });
        }
        return;
      }

      if (signal.kind === "hand_raise") {
        onHandRaiseUpdateRef.current?.({
          participantId: fromId,
          senderName: signal.fromName || "Participant",
          isRaised: Boolean(signal.payload.isRaised),
        });
        return;
      }

      if (signal.kind === "offer") {
        const sdp = signal.payload.sdp as RTCSessionDescriptionInit | undefined;
        if (!sdp) return;

        const pc = createPeerConnection(fromId);
        try {
          if (pc.signalingState === "have-local-offer") {
            // Polite peer rolls back local offer; impolite keeps its offer
            if (compareIds(myUserId, fromId) < 0) {
              return;
            }
            await pc.setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit);
          }

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const queued = pendingIceRef.current.get(fromId) || [];
          pendingIceRef.current.delete(fromId);
          for (const ice of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(ice)).catch(() => {});
          }

          await syncLocalTracksToPeer(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal("answer", { sdp: pc.localDescription?.toJSON() || answer }, fromId);
        } catch (err) {
          console.warn(`[WEBRTC] Failed handling offer from ${fromId}:`, err);
        }
        return;
      }

      if (signal.kind === "answer") {
        const sdp = signal.payload.sdp as RTCSessionDescriptionInit | undefined;
        const pc = peersRef.current.get(fromId);
        if (!sdp || !pc) return;
        try {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const queued = pendingIceRef.current.get(fromId) || [];
            pendingIceRef.current.delete(fromId);
            for (const ice of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(ice)).catch(() => {});
            }
          }
        } catch (err) {
          console.warn(`[WEBRTC] Failed handling answer from ${fromId}:`, err);
        }
        return;
      }

      if (signal.kind === "ice") {
        const candidate = signal.payload.candidate as RTCIceCandidateInit | undefined;
        if (!candidate) return;
        const pc = peersRef.current.get(fromId);
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        } else {
          const list = pendingIceRef.current.get(fromId) || [];
          list.push(candidate);
          pendingIceRef.current.set(fromId, list);
        }
      }
    },
    [closePeer, createPeerConnection, enabled, myUserId, rebuildRemotePeersState, sendSignal, syncLocalTracksToPeer],
  );

  // Sync local audio/video tracks whenever localCameraStream or screenStream changes
  useEffect(() => {
    if (!enabled) return;
    peersRef.current.forEach((pc, peerId) => {
      void syncLocalTracksToPeer(pc).then(() => {
        if (myUserId && compareIds(myUserId, peerId) < 0 && pc.signalingState === "stable") {
          void initiateOfferToPeer(peerId);
        }
      });
    });
  }, [enabled, localCameraStream, screenStream, myUserId, syncLocalTracksToPeer, initiateOfferToPeer]);

  // Broadcast media state (mic / camera / screen share) on changes
  useEffect(() => {
    if (!enabled || !meetingCode) return;
    void sendSignal("media_state", {
      isMicEnabled,
      isCameraEnabled,
      isScreenSharing,
    });
  }, [enabled, meetingCode, isMicEnabled, isCameraEnabled, isScreenSharing, sendSignal]);

  // Socket listener + HTTP polling loop for signaling & roster sync
  useEffect(() => {
    if (!enabled || !meetingCode || !myUserId) return;

    let cancelled = false;
    const socket = socketService.getSocket();

    const onSocketSignal = (sig: MeetSignalItem) => {
      void handleSignal(sig);
    };
    socket?.on("meet:signal", onSocketSignal);

    const pollOnce = async () => {
      if (cancelled || isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const data = await meetApi.getSignals(meetingCode, lastSignalIdRef.current);
        if (cancelled) return;

        if (data.latestId) {
          lastSignalIdRef.current = data.latestId;
        }

        if (data.meetingStatus === "ENDED" || data.meetingStatus === "CANCELLED") {
          onMeetingEndedRef.current?.();
          return;
        }

        if (myRole === "HOST") {
          setWaitingParticipants(data.waitingParticipants || []);
        }

        const activeIds = new Set(data.activeParticipants.map((p) => p.userId));

        // Remove peers who left
        Array.from(peerMetaRef.current.keys()).forEach((peerId) => {
          if (!activeIds.has(peerId)) {
            closePeer(peerId, false);
          }
        });

        // Register or connect to active peers
        for (const peer of data.activeParticipants) {
          if (peer.userId === myUserId) continue;

          const prevMeta = peerMetaRef.current.get(peer.userId);
          peerMetaRef.current.set(peer.userId, {
            name: peer.fullName,
            avatarUrl: peer.avatarUrl,
            role: peer.role,
            isMicEnabled: prevMeta?.isMicEnabled ?? true,
            isCameraEnabled: prevMeta?.isCameraEnabled ?? true,
            isScreenSharing: prevMeta?.isScreenSharing ?? false,
          });

          if (!peersRef.current.has(peer.userId)) {
            if (compareIds(myUserId, peer.userId) < 0) {
              await initiateOfferToPeer(peer.userId);
            } else {
              createPeerConnection(peer.userId);
            }
          }
        }
        rebuildRemotePeersState();

        for (const signal of data.signals) {
          await handleSignal(signal);
        }
      } catch (err) {
        console.warn("[WEBRTC] Signal poll warning:", err);
      } finally {
        isPollingRef.current = false;
      }
    };

    void pollOnce();
    const interval = setInterval(() => {
      void pollOnce();
    }, 1200);

    return () => {
      cancelled = true;
      clearInterval(interval);
      socket?.off("meet:signal", onSocketSignal);
    };
  }, [
    enabled,
    meetingCode,
    myUserId,
    myRole,
    closePeer,
    createPeerConnection,
    handleSignal,
    initiateOfferToPeer,
    rebuildRemotePeersState,
    setWaitingParticipants,
  ]);

  // Toggle screen share in WebRTC mode
  const toggleWebRtcScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setIsScreenSharing(false);
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          screenStreamRef.current = null;
          setScreenStream(null);
          setIsScreenSharing(false);
        };
      }
      screenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      setIsScreenSharing(true);
    } catch (err) {
      console.warn("[WEBRTC] Screen share cancelled or failed:", err);
      setIsScreenSharing(false);
    }
  }, [setIsScreenSharing]);

  const leaveWebRtc = useCallback(() => {
    Array.from(peersRef.current.keys()).forEach((peerId) => {
      closePeer(peerId, false);
    });
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }
    stopLocalCameraStream();
    if (meetingCode) {
      void meetApi.leaveMeeting(meetingCode).catch(() => {});
    }
  }, [closePeer, meetingCode, stopLocalCameraStream]);

  // Clean up on unmount when active
  useEffect(() => {
    if (!enabled) return;
    return () => {
      Array.from(peersRef.current.keys()).forEach((peerId) => closePeer(peerId, false));
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (meetingCode) {
        void meetApi.leaveMeeting(meetingCode).catch(() => {});
      }
    };
  }, [enabled, meetingCode, closePeer]);

  const localFallbackTile: FallbackParticipantTileData | null = enabled
    ? {
        id: myUserId || "local-user",
        name: myName,
        avatarUrl: myAvatarUrl ?? null,
        role: myRole,
        isLocal: true,
        stream: screenStream || localCameraStream,
        isMicEnabled,
        isCameraEnabled: isScreenSharing ? true : isCameraEnabled,
        isScreenSharing,
      }
    : null;

  return {
    localStream: screenStream || localCameraStream,
    localFallbackTile,
    remoteFallbackPeers: remotePeers,
    sendWebRtcReaction: (emoji: string) =>
      sendSignal("reaction", { emoji }),
    sendWebRtcHandRaise: (isRaised: boolean) =>
      sendSignal("hand_raise", { isRaised }),
    toggleWebRtcScreenShare,
    leaveWebRtc,
  };
}
