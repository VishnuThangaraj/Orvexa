import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  Copy,
  Check,
  Users,
  AlertCircle,
  Loader2,
  Share2,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useMeetStore } from "../store/meet.store";
import { useMediaStream } from "../hooks/useMediaStream";
import { useMeetSocket } from "../hooks/useMeetSocket";
import { DeviceSettingsModal } from "./DeviceSettingsModal";
import type { Meeting } from "../types/meet.types";

interface PreJoinScreenProps {
  meeting: Meeting;
  meetingCode: string;
  onJoin: (displayName: string) => void;
  isJoining?: boolean;
}

export const PreJoinScreen: React.FC<PreJoinScreenProps> = ({
  meeting,
  meetingCode,
  onJoin,
  isJoining = false,
}) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const waitingState = useMeetStore((state) => state.waitingState);

  const [displayName, setDisplayName] = useState<string>(
    currentUser?.fullName || "Guest"
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    stream,
    isCameraEnabled,
    isMicEnabled,
    audioLevel,
    permissionDenied,
    errorMessage,
    toggleCamera,
    toggleMic,
  } = useMediaStream({ autoStart: true });

  // Attach local stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isHost = currentUser?.id === meeting.hostId;
  const requiresApproval = meeting.requireApproval && !isHost;

  const { knock, cancelKnock } = useMeetSocket({
    meetingCode,
    onAdmitted: () => {
      onJoin(displayName);
    },
  });

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/meet/${meetingCode}`;
    navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrimaryAction = () => {
    if (requiresApproval && waitingState === "idle") {
      knock(displayName);
    } else {
      onJoin(displayName);
    }
  };

  const handleCancelKnock = () => {
    cancelKnock();
  };

  // Participant names preview
  const activeParticipants = meeting.participants?.filter(
    (p) => !p.leftAt
  ) || [];

  const participantsLabel = () => {
    if (activeParticipants.length === 0) {
      return "No one else is in this call";
    }
    const names = activeParticipants
      .slice(0, 2)
      .map((p) => p.user?.fullName || "Participant");
    const count = activeParticipants.length;
    if (count === 1) {
      return `${names[0]} is in this call`;
    }
    if (count === 2) {
      return `${names[0]} and ${names[1]} are in this call`;
    }
    return `${names[0]}, ${names[1]} and ${count - 2} other${count - 2 > 1 ? "s" : ""} are in this call`;
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-neutral-800">
        <Link to="/meet" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-500 transition">
            <Video className="w-5 h-5" />
          </div>
          <span className="text-xl font-medium tracking-tight text-white">
            Orvexa <span className="text-neutral-400 font-normal">Meet</span>
          </span>
        </Link>

        {/* User profile / email */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-neutral-400 font-medium">Signed in as</p>
            <p className="text-sm text-neutral-200 font-medium truncate max-w-[200px]">
              {currentUser?.email || "Guest"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-sm text-white shadow-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        {/* Left Column: Camera Preview Box */}
        <div className="w-full lg:w-3/5 flex flex-col items-center">
          <div className="relative w-full aspect-video max-w-xl bg-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl border border-neutral-700/60 flex items-center justify-center">
            {/* Live Video Track */}
            {isCameraEnabled && !permissionDenied ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-semibold text-white shadow-lg mb-3">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <p className="text-neutral-300 text-sm font-medium">Camera is off</p>
              </div>
            )}

            {/* Mic Speaking Pulse Indicator (Top Left) */}
            {isMicEnabled && audioLevel > 5 && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 animate-in fade-in">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-neutral-200 font-medium">Speaking</span>
              </div>
            )}

            {/* Bottom Overlay Controls Bar */}
            <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-4 z-10">
              {/* Mic Toggle Button */}
              <button
                type="button"
                onClick={toggleMic}
                aria-label={isMicEnabled ? "Turn off microphone" : "Turn on microphone"}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isMicEnabled
                    ? "bg-neutral-800/90 hover:bg-neutral-700/90 text-white border border-neutral-600/80"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
              >
                {isMicEnabled ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </button>

              {/* Camera Toggle Button */}
              <button
                type="button"
                onClick={toggleCamera}
                aria-label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isCameraEnabled
                    ? "bg-neutral-800/90 hover:bg-neutral-700/90 text-white border border-neutral-600/80"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
              >
                {isCameraEnabled ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>

              {/* Device Settings Gear */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Audio and video settings"
                className="w-12 h-12 rounded-full bg-neutral-800/90 hover:bg-neutral-700/90 text-white border border-neutral-600/80 flex items-center justify-center shadow-lg transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Permission / Hardware Error Alerts */}
          {permissionDenied && (
            <div className="mt-4 w-full max-w-xl bg-amber-950/60 border border-amber-600/40 rounded-xl p-3 flex items-start gap-3 text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Permissions restricted</p>
                <p className="text-amber-300/90 mt-0.5">
                  Microphone or camera permission was blocked. You can still join the call to listen and watch.
                </p>
              </div>
            </div>
          )}

          {errorMessage && !permissionDenied && (
            <div className="mt-4 w-full max-w-xl bg-neutral-800/60 border border-neutral-700 rounded-xl p-3 flex items-start gap-3 text-neutral-300 text-xs">
              <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: Join Action Card */}
        <div className="w-full lg:w-2/5 flex flex-col items-center lg:items-start max-w-md text-center lg:text-left">
          <div className="space-y-2 mb-6">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
              {waitingState === "knocking"
                ? "Asking to be let in…"
                : waitingState === "denied"
                ? "You can't join this call"
                : "Ready to join?"}
            </h1>
            <p className="text-sm text-neutral-400 flex items-center justify-center lg:justify-start gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              <span>{participantsLabel()}</span>
            </p>
          </div>

          {/* Editable Display Name if guest */}
          {!currentUser && (
            <div className="w-full mb-5 text-left">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          )}

          {/* Action Buttons based on waiting state */}
          {waitingState === "idle" && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={isJoining || !displayName.trim()}
                className="w-full sm:flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-full shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting…</span>
                  </>
                ) : requiresApproval ? (
                  <span>Ask to join</span>
                ) : (
                  <span>Join now</span>
                )}
              </button>
            </div>
          )}

          {waitingState === "knocking" && (
            <div className="w-full bg-neutral-800/80 border border-neutral-700 rounded-2xl p-5 text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Waiting for the host</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Someone in the call will let you in shortly.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelKnock}
                className="px-5 py-2 text-sm text-neutral-300 hover:text-white bg-neutral-700 hover:bg-neutral-600 rounded-full transition"
              >
                Cancel
              </button>
            </div>
          )}

          {waitingState === "denied" && (
            <div className="w-full bg-red-950/40 border border-red-800/60 rounded-2xl p-5 text-center space-y-4">
              <p className="text-sm font-medium text-red-300">
                The host denied your request to join this meeting.
              </p>
              <button
                type="button"
                onClick={() => navigate("/meet")}
                className="px-5 py-2 text-sm text-white bg-neutral-800 hover:bg-neutral-700 rounded-full transition"
              >
                Return to Meet
              </button>
            </div>
          )}

          {/* Meeting Info & Copy Link Section */}
          <div className="mt-8 pt-6 border-t border-neutral-800 w-full flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-neutral-500" />
              <span className="font-mono text-neutral-300">{meetingCode}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy joining info</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioLevel={audioLevel}
        previewStream={stream}
      />
    </div>
  );
};

export default PreJoinScreen;
