import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Keyboard,
  Plus,
  Calendar,
  Clock,
  Users,
  Loader2,
  Radio,
  ChevronDown,
} from "lucide-react";
import WidgetCard from "./WidgetCard";
import type { HomeMeetData } from "../types/home.types";
import meetApi from "@/modules/meet/api/meet.api";
import { normalizeMeetingCode } from "@/modules/meet/utils/meet.utils";
import { cn } from "@/lib/utils";

interface MeetWidgetProps {
  data?: HomeMeetData;
  isLoading?: boolean;
  error?: string | null;
  size?: "full" | "half" | string;
  onResize?: (size: "full" | "half") => void;
  onRetry?: () => void;
}

export const MeetWidget: React.FC<MeetWidgetProps> = ({
  data,
  isLoading = false,
  error = null,
  size = "half",
  onResize,
  onRetry,
}) => {
  const navigate = useNavigate();
  const [codeOrUrl, setCodeOrUrl] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);

  const handleStartInstant = async () => {
    try {
      setIsCreatingInstant(true);
      setShowNewMenu(false);
      const meeting = await meetApi.createMeeting({
        title: "Instant Meeting",
      });
      navigate(`/meet/${meeting.meetingCode}`);
    } catch (err) {
      console.error("Failed to start instant meeting:", err);
      navigate("/meet");
    } finally {
      setIsCreatingInstant(false);
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    const normalized = normalizeMeetingCode(codeOrUrl);
    if (!normalized) {
      setJoinError("Invalid code format (e.g. abc-defg-hij)");
      return;
    }

    setIsJoining(true);
    navigate(`/meet/${normalized}`);
  };

  const formatMeetingTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const activeMeetings = data?.activeMeetings || [];
  const upcomingMeetings = data?.upcomingMeetings || [];
  const totalCount = activeMeetings.length + upcomingMeetings.length;

  const headerActions = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowNewMenu(!showNewMenu)}
        disabled={isCreatingInstant}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
      >
        {isCreatingInstant ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
        <span>New meeting</span>
        <ChevronDown className="w-3 h-3 opacity-80" />
      </button>

      {showNewMenu && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowNewMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-60 rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <button
              type="button"
              onClick={handleStartInstant}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Video size={16} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Start instant meeting</p>
                <p className="text-[10px] text-slate-400">Launch call immediately</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewMenu(false);
                navigate("/calendar?create=true");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Schedule in Calendar</p>
                <p className="text-[10px] text-slate-400">Send invites to attendees</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <WidgetCard
      id="meet"
      title="Meet"
      icon={Video}
      iconColor="text-[#00897b]"
      iconBg="bg-teal-50 dark:bg-teal-950/40"
      badge={totalCount > 0 ? `${totalCount} active/scheduled` : undefined}
      badgeColor="bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/40"
      openTo="/meet"
      openLabel="Open Meet"
      headerActions={headerActions}
      size={size}
      onResize={onResize}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      <div className="space-y-4">
        {/* Join With Code or Link Input */}
        <form onSubmit={handleJoinWithCode} className="space-y-1">
          <div className="relative flex items-center">
            <Keyboard className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter a code or link"
              value={codeOrUrl}
              onChange={(e) => {
                setCodeOrUrl(e.target.value);
                if (joinError) setJoinError(null);
              }}
              className={cn(
                "w-full pl-10 pr-20 py-2.5 text-xs rounded-full border bg-slate-50/80 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all",
                joinError
                  ? "border-red-300 dark:border-red-800"
                  : "border-slate-200/80 dark:border-slate-700"
              )}
            />
            <button
              type="submit"
              disabled={!codeOrUrl.trim() || isJoining}
              className="absolute right-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors active:scale-95 cursor-pointer shadow-2xs"
            >
              {isJoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Join"}
            </button>
          </div>
          {joinError && (
            <p className="text-[11px] text-red-500 dark:text-red-400 pl-3">{joinError}</p>
          )}
        </form>

        {/* Live Active Meetings (Highest Priority) */}
        {activeMeetings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>Live Calls Right Now</span>
            </div>
            <div className="space-y-2">
              {activeMeetings.map((active) => (
                <div
                  key={active.id}
                  className="flex items-center justify-between p-3.5 rounded-[20px] border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-2xs"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse shrink-0" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {active.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>Host: {active.hostName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                        <Users className="w-3 h-3" />
                        {active.participantCount} in call
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/meet/${active.code}`)}
                    className="shrink-0 px-4 py-2 text-xs font-bold rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Join now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Scheduled Meetings */}
        {upcomingMeetings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Clock className="w-3 h-3" />
              <span>Upcoming Today</span>
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {meeting.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {formatMeetingTime(meeting.scheduledStart)} • Host: {meeting.hostName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/meet/${meeting.code}`)}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-colors cursor-pointer"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state if no meetings active or upcoming */}
        {activeMeetings.length === 0 && upcomingMeetings.length === 0 && (
          <div className="py-8 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-[#00897b] flex items-center justify-center mx-auto border border-teal-100 dark:border-teal-900/40">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                No meetings scheduled
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                Start an instant video meeting or schedule one in Calendar.
              </p>
            </div>
          </div>
        )}
      </div>
    </WidgetCard>
  );
};

export default MeetWidget;
