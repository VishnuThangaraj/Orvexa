import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Keyboard,
  Link as LinkIcon,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  HelpCircle,
  Settings,
  MessageSquareQuote,
  Loader2,
} from "lucide-react";
import { useMeetStore } from "../store/meet.store";
import { normalizeMeetingCode } from "../utils/meet.utils";
import CreateLaterModal from "../components/CreateLaterModal";

interface CarouselSlide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgGradient: string;
}

const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 1,
    title: "Get a link you can share",
    description:
      "Click New meeting to get a link you can send to people you want to meet with",
    icon: <LinkIcon size={48} className="text-blue-500" />,
    bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40",
  },
  {
    id: 2,
    title: "Plan ahead",
    description:
      "Click New meeting to schedule meetings in Orvexa Calendar and send invites to attendees",
    icon: <Calendar size={48} className="text-emerald-500" />,
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40",
  },
  {
    id: 3,
    title: "Your meeting is safe",
    description:
      "No one can join a meeting unless invited or admitted by the host",
    icon: <ShieldCheck size={48} className="text-amber-500" />,
    bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40",
  },
];

export const MeetLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { createMeeting, userMeetings, fetchUserMeetings } = useMeetStore();

  const [currentTime, setCurrentTime] = useState("");
  const [meetingInput, setMeetingInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);
  const [createdLaterCode, setCreatedLaterCode] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Real-time clock: "10:35 PM • Wed, Nov 18"
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const dateStr = now.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      setCurrentTime(`${timeStr} • ${dateStr}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch upcoming/recent meetings
  useEffect(() => {
    fetchUserMeetings();
  }, [fetchUserMeetings]);

  // Carousel auto-rotate
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  const normalizedCode = normalizeMeetingCode(meetingInput);
  const isJoinEnabled = Boolean(normalizedCode);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (normalizedCode) {
      navigate(`/meet/${normalizedCode}`);
    }
  };

  const handleStartInstant = async () => {
    try {
      setIsCreatingInstant(true);
      setIsDropdownOpen(false);
      const meeting = await createMeeting({
        title: "Instant Meeting",
        requireApproval: false, // Instant calls can be joined directly by host
      });
      navigate(`/meet/${meeting.meetingCode}`);
    } catch (err) {
      console.error("Failed to start instant meeting:", err);
    } finally {
      setIsCreatingInstant(false);
    }
  };

  const handleCreateLater = async () => {
    try {
      setIsDropdownOpen(false);
      const meeting = await createMeeting({
        title: "Meeting for Later",
        requireApproval: true,
      });
      setCreatedLaterCode(meeting.meetingCode);
    } catch (err) {
      console.error("Failed to create meeting for later:", err);
    }
  };

  const handleScheduleInCalendar = async () => {
    setIsDropdownOpen(false);
    try {
      const meeting = await createMeeting({
        title: "Scheduled Meeting",
        requireApproval: true,
      });
      navigate(
        `/calendar?create=true&meet=true&code=${meeting.meetingCode}&meetId=${meeting.id}&title=${encodeURIComponent("Scheduled Meeting")}`,
      );
    } catch {
      navigate("/calendar?create=true&meet=true");
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-6 sm:px-12 py-8 overflow-y-auto">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Video size={24} />
          </div>
          <div>
            <span className="text-xl font-medium tracking-tight text-slate-800 dark:text-white">
              Orvexa <span className="text-blue-600 dark:text-blue-400 font-semibold">Meet</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 text-sm">
          <div className="hidden sm:flex items-center gap-2">
            <Clock size={16} />
            <span>{currentTime}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Support & Help"
            >
              <HelpCircle size={18} />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Send feedback"
            >
              <MessageSquareQuote size={18} />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 py-8 lg:py-16 max-w-6xl mx-auto w-full">
        {/* Left Column: Action Area */}
        <div className="flex-1 max-w-xl space-y-7 text-center lg:text-left">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-slate-900 dark:text-white leading-tight">
              Video calls and meetings for everyone
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed">
              Connect, collaborate and celebrate from anywhere with Orvexa Meet
            </p>
          </div>

          {/* New meeting & Code Input row */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {/* New Meeting Dropdown */}
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                disabled={isCreatingInstant}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {isCreatingInstant ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Video size={18} />
                )}
                <span>New meeting</span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={handleCreateLater}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    >
                      <LinkIcon size={16} className="text-slate-500" />
                      <span>Create a meeting for later</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStartInstant}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    >
                      <Plus size={16} className="text-slate-500" />
                      <span>Start an instant meeting</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleScheduleInCalendar}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left border-t border-slate-100 dark:border-slate-800"
                    >
                      <Calendar size={16} className="text-slate-500" />
                      <span>Schedule in Orvexa Calendar</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Code Input Form */}
            <form
              onSubmit={handleJoinByCode}
              className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Keyboard size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Enter a code or link"
                  value={meetingInput}
                  onChange={(e) => setMeetingInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent rounded-full border border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={!isJoinEnabled}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${
                  isJoinEnabled
                    ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer active:scale-95"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                Join
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
              Learn more
            </span>{" "}
            about Orvexa Meet
          </div>
        </div>

        {/* Right Column: Interactive Illustration Carousel */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
          <div className="relative w-full aspect-square max-w-xs sm:max-w-sm flex flex-col items-center justify-center p-8 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-inner">
            {/* Slide Circle */}
            <div
              className={`w-32 h-32 rounded-full bg-linear-to-br ${CAROUSEL_SLIDES[activeSlide].bgGradient} flex items-center justify-center mb-6 shadow-sm transition-all duration-500`}
            >
              {CAROUSEL_SLIDES[activeSlide].icon}
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white transition-all duration-300">
                {CAROUSEL_SLIDES[activeSlide].title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed px-4 transition-all duration-300">
                {CAROUSEL_SLIDES[activeSlide].description}
              </p>
            </div>
          </div>

          {/* Carousel Navigation Dots */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() =>
                setActiveSlide(
                  (prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length,
                )
              }
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1.5">
              {CAROUSEL_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activeSlide === index
                      ? "w-6 bg-blue-600 dark:bg-blue-400"
                      : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)
              }
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Today's / Upcoming Meetings Section */}
      {userMeetings.length > 0 && (
        <div className="max-w-4xl mx-auto w-full pt-8 pb-4 border-t border-slate-100 dark:border-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <span>Your Recent & Upcoming Meetings</span>
            </h3>
            <span className="text-xs text-slate-400">
              {userMeetings.length} {userMeetings.length === 1 ? "meeting" : "meetings"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userMeetings.slice(0, 6).map((m) => (
              <div
                key={m.id}
                className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wide">
                      {m.meetingCode}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        m.status === "LIVE"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 animate-pulse"
                          : m.status === "SCHEDULED"
                          ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Host: {m.host?.fullName || "User"}
                  </p>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/meet/${m.meetingCode}`)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-medium transition-colors cursor-pointer"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create Meeting for Later */}
      {createdLaterCode && (
        <CreateLaterModal
          meetingCode={createdLaterCode}
          onClose={() => setCreatedLaterCode(null)}
        />
      )}
    </div>
  );
};

export default MeetLandingPage;
