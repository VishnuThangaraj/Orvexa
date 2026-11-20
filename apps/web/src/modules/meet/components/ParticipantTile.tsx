import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  Participant,
  ParticipantEvent,
  Track,
  ConnectionQuality,
} from "livekit-client";
import {
  MicOff,
  Pin,
  PinOff,
  Hand,
  Wifi,
  WifiOff,
} from "lucide-react";

interface ParticipantTileProps {
  participant?: Participant | null;
  isLocal?: boolean;
  isPinned?: boolean;
  onTogglePin?: (id: string) => void;
  isHandRaised?: boolean;
  fallbackStream?: MediaStream | null;
  fallbackUser?: { fullName?: string; email?: string } | null;
  className?: string;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  isLocal = false,
  isPinned = false,
  onTogglePin,
  isHandRaised = false,
  fallbackStream,
  fallbackUser,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Re-render on participant internal track/speaking events
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!participant) return;

    const forceUpdate = () => setTick((t) => t + 1);

    participant.on(ParticipantEvent.TrackPublished, forceUpdate);
    participant.on(ParticipantEvent.TrackUnpublished, forceUpdate);
    participant.on(ParticipantEvent.TrackMuted, forceUpdate);
    participant.on(ParticipantEvent.TrackUnmuted, forceUpdate);
    participant.on(ParticipantEvent.IsSpeakingChanged, forceUpdate);
    participant.on(ParticipantEvent.ConnectionQualityChanged, forceUpdate);

    return () => {
      participant.off(ParticipantEvent.TrackPublished, forceUpdate);
      participant.off(ParticipantEvent.TrackUnpublished, forceUpdate);
      participant.off(ParticipantEvent.TrackMuted, forceUpdate);
      participant.off(ParticipantEvent.TrackUnmuted, forceUpdate);
      participant.off(ParticipantEvent.IsSpeakingChanged, forceUpdate);
      participant.off(ParticipantEvent.ConnectionQualityChanged, forceUpdate);
    };
  }, [participant]);

  // Parse metadata
  const metadata = useMemo(() => {
    if (!participant?.metadata) return {};
    try {
      return JSON.parse(participant.metadata);
    } catch {
      return {};
    }
  }, [participant?.metadata]);

  const displayName =
    metadata.fullName ||
    participant?.name ||
    fallbackUser?.fullName ||
    (isLocal ? "You" : "Participant");
  const avatarUrl = metadata.avatar || null;

  // Track publications
  const cameraPub = participant?.getTrackPublication?.(Track.Source.Camera);
  const screenPub = participant?.getTrackPublication?.(Track.Source.ScreenShare);
  const audioPub = participant?.getTrackPublication?.(Track.Source.Microphone);

  const videoTrack = screenPub?.track || cameraPub?.track;
  const isVideoMuted = !videoTrack || videoTrack.isMuted;
  const isAudioMuted =
    !participant || !audioPub?.track || audioPub.isMuted || !participant.isMicrophoneEnabled;
  const isSpeaking = participant?.isSpeaking || false;

  // Attach video track or local fallback
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (videoTrack) {
      videoTrack.attach(videoEl);
      return () => {
        videoTrack.detach(videoEl);
      };
    } else if (isLocal && fallbackStream) {
      videoEl.srcObject = fallbackStream;
      return () => {
        videoEl.srcObject = null;
      };
    }
  }, [videoTrack, isLocal, fallbackStream]);

  // Attach audio track for remote participants
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || isLocal || !audioPub?.track) return;

    const aTrack = audioPub.track;
    aTrack.attach(audioEl);
    return () => {
      aTrack.detach(audioEl);
    };
  }, [audioPub?.track, isLocal]);

  // Quality indicator
  const renderQuality = () => {
    if (!participant) {
      return (
        <span title="Connecting...">
          <Wifi className="w-3.5 h-3.5 text-neutral-400 opacity-60" />
        </span>
      );
    }
    const q = participant.connectionQuality;
    if (q === ConnectionQuality.Poor || q === ConnectionQuality.Lost) {
      return (
        <span title="Poor connection">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        </span>
      );
    }
    return (
      <span title="Good connection">
        <Wifi className="w-3.5 h-3.5 text-neutral-400 opacity-60" />
      </span>
    );
  };

  const hasActiveVideo =
    (!isVideoMuted && Boolean(videoTrack)) ||
    (isLocal && Boolean(fallbackStream) && !isVideoMuted);

  const tileIdentity = participant?.identity || (isLocal ? "local-user" : "participant");

  return (
    <div
      className={`group relative w-full h-full bg-[#3c4043] rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-200 select-none ${
        isSpeaking
          ? "ring-4 ring-blue-500 shadow-lg shadow-blue-500/20"
          : "border border-neutral-700/60"
      } ${className}`}
    >
      {/* Remote Audio element */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Video Track Display */}
      {hasActiveVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${
            isLocal && !screenPub ? "-scale-x-100" : ""
          }`}
        />
      ) : (
        /* Avatar Initial Fallback */
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-semibold shadow-lg">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      )}

      {/* Top Left: Hand Raised Badge */}
      {isHandRaised && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-500 text-neutral-900 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md animate-bounce">
          <Hand className="w-3.5 h-3.5" />
          <span>Hand raised</span>
        </div>
      )}

      {/* Top Right: Pin / Unpin Button (hover or pinned) */}
      {onTogglePin && (
        <button
          onClick={() => onTogglePin(tileIdentity)}
          aria-label={isPinned ? "Unpin tile" : "Pin tile to stage"}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition ${
            isPinned ? "opacity-100 text-blue-400" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
      )}

      {/* Bottom Left: Name pill with audio status */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white max-w-[85%] shadow-sm">
        <span className="truncate">
          {displayName}
          {isLocal && " (You)"}
        </span>
        {isAudioMuted && (
          <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center shrink-0">
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {renderQuality()}
      </div>
    </div>
  );
};

export default ParticipantTile;
