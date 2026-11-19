import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Link2,
  Calendar,
  FileText,
  Mail,
  Send,
  ExternalLink,
} from "lucide-react";
import { useMeetStore } from "../../store/meet.store";
import api from "@/common/service/api";

interface MeetingDetailsPanelProps {
  meetingCode: string;
  onClose: () => void;
}

export const MeetingDetailsPanel: React.FC<MeetingDetailsPanelProps> = ({
  meetingCode,
  onClose,
}) => {
  const currentMeeting = useMeetStore((state) => state.currentMeeting);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "sent" | "error">("idle");

  const fullUrl = `${window.location.origin}/meet/${meetingCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) return;

    setIsSendingInvite(true);
    setInviteStatus("idle");
    try {
      await api.post("/mail/send", {
        to: [inviteEmail.trim()],
        subject: `Invitation: ${currentMeeting?.title || "Orvexa Meet Video Call"}`,
        body: `You are invited to join a Orvexa Meet video meeting.\n\nMeeting Title: ${currentMeeting?.title || "Orvexa Meet Video Call"}\nJoin Link: ${fullUrl}\nMeeting Code: ${meetingCode}\n\nClick the link above to join when the meeting starts.`,
      });
      setInviteStatus("sent");
      setInviteEmail("");
      setTimeout(() => setInviteStatus("idle"), 4000);
    } catch (err) {
      console.error("Failed to send meeting invite email:", err);
      setInviteStatus("error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleOpenCalendar = () => {
    const calUrl = `/calendar?create=true&meet=true&code=${meetingCode}&title=${encodeURIComponent(currentMeeting?.title || "Video Call")}`;
    window.open(calUrl, "_blank");
  };

  return (
    <aside className="w-80 sm:w-96 h-full bg-[#202124] border-l border-neutral-800 flex flex-col text-neutral-100 z-30 select-none">
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-800 shrink-0">
        <h3 className="text-base font-medium">Meeting details</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          aria-label="Close details panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Joining Info Card */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Joining info
          </h4>
          <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-neutral-300">
              <Link2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-mono truncate">{fullUrl}</span>
            </div>
            <div className="text-xs text-neutral-400">
              Dial-in: <span className="font-mono text-neutral-200">{meetingCode}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-full shadow-xs transition flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied to clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Copy joining info</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Meeting Information */}
        {currentMeeting && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              About this call
            </h4>
            <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">{currentMeeting.title}</p>
                  {currentMeeting.scheduledStart && (
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {new Date(currentMeeting.scheduledStart).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {currentMeeting.description && (
                <div className="pt-2 border-t border-neutral-700/50 flex items-start gap-2.5 text-xs text-neutral-300">
                  <FileText className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{currentMeeting.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share via Email */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Share via email
          </h4>
          <form
            onSubmit={handleSendInvite}
            className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2 bg-neutral-900/80 rounded-xl px-3 py-2 border border-neutral-700/60 focus-within:border-blue-500">
              <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="email"
                placeholder="colleague@orvexa.local"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingInvite || !inviteEmail.trim()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-full shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingInvite ? "Sending..." : "Send invite email"}</span>
            </button>

            {inviteStatus === "sent" && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Invitation email sent successfully!</span>
              </p>
            )}
            {inviteStatus === "error" && (
              <p className="text-[11px] text-rose-400">
                Failed to send invitation. Please check the email.
              </p>
            )}
          </form>
        </div>

        {/* Add to Orvexa Calendar */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Calendar integration
          </h4>
          <button
            type="button"
            onClick={handleOpenCalendar}
            className="w-full py-2.5 px-4 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/80 text-white text-xs font-medium rounded-2xl shadow-xs transition flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Schedule in Orvexa Calendar</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default MeetingDetailsPanel;
