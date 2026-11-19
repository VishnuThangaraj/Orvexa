import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useMeetStore } from "../store/meet.store";
import { normalizeMeetingCode } from "../utils/meet.utils";
import { PreJoinScreen } from "../components/PreJoinScreen";
import { ActiveMeetingRoom } from "../components/ActiveMeetingRoom";

export const MeetingRoomPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const currentMeeting = useMeetStore((state) => state.currentMeeting);
  const isLoading = useMeetStore((state) => state.isLoading);
  const error = useMeetStore((state) => state.error);
  const liveKitData = useMeetStore((state) => state.liveKitData);
  const fetchMeetingByCode = useMeetStore((state) => state.fetchMeetingByCode);
  const fetchLiveKitToken = useMeetStore((state) => state.fetchLiveKitToken);
  const resetMeetingState = useMeetStore((state) => state.resetMeetingState);

  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const normalizedCode = code ? normalizeMeetingCode(code) : null;

  useEffect(() => {
    if (!normalizedCode) {
      navigate("/meet");
      return;
    }

    fetchMeetingByCode(normalizedCode).catch((err) => {
      console.warn("Failed to load meeting:", err);
    });

    return () => {
      resetMeetingState();
    };
  }, [normalizedCode, navigate, fetchMeetingByCode, resetMeetingState]);

  const handleJoinCall = async (_name: string) => {
    void _name;
    if (!normalizedCode) return;
    setIsJoining(true);
    setJoinError(null);

    try {
      await fetchLiveKitToken(normalizedCode);
      setHasJoined(true);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const status = axiosErr.response?.status;
      if (status === 403) {
        // Handled by store waitingState ("knocking")
      } else {
        const msg =
          axiosErr.response?.data?.message || axiosErr.message || "Failed to join meeting";
        setJoinError(msg);
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (!normalizedCode) {
    return null;
  }

  if (isLoading && !currentMeeting) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-neutral-400 text-sm">Getting meeting ready…</p>
      </div>
    );
  }

  if (error && !currentMeeting) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-800/80 flex items-center justify-center mb-4 text-red-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-medium mb-2">Couldn't find that meeting</h1>
        <p className="text-neutral-400 text-sm max-w-sm mb-6">{error}</p>
        <button
          onClick={() => navigate("/meet")}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-full transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Meet
        </button>
      </div>
    );
  }

  if (!currentMeeting) {
    return null;
  }

  if (currentMeeting.status === "ENDED") {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4 text-neutral-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-medium mb-2">This meeting has ended</h1>
        <p className="text-neutral-400 text-sm max-w-sm mb-6">
          The host ended the call or everyone left.
        </p>
        <button
          onClick={() => navigate("/meet")}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-full transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Meet
        </button>
      </div>
    );
  }

  // Active LiveKit Room View (Mode 2)
  if (hasJoined && liveKitData) {
    return (
      <ActiveMeetingRoom
        meeting={currentMeeting}
        meetingCode={normalizedCode}
      />
    );
  }

  // Pre-join Green Room View (Mode 1)
  return (
    <>
      {joinError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{joinError}</span>
        </div>
      )}
      <PreJoinScreen
        meeting={currentMeeting}
        meetingCode={normalizedCode}
        onJoin={handleJoinCall}
        isJoining={isJoining}
      />
    </>
  );
};

export default MeetingRoomPage;
