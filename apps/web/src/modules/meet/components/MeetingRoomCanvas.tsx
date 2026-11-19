import React from "react";
import { Participant, LocalParticipant, RemoteParticipant } from "livekit-client";
import { ParticipantTile } from "./ParticipantTile";
import type { ReactionItem, HandRaiseItem } from "../hooks/useMeetingRoom";

export type MeetLayoutMode = "tiled" | "spotlight" | "sidebar";

interface MeetingRoomCanvasProps {
  layoutMode: MeetLayoutMode;
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
  activeSpeakers: Participant[];
  pinnedParticipantId: string | null;
  onTogglePin: (id: string) => void;
  raisedHands: HandRaiseItem[];
  reactions: ReactionItem[];
  fallbackStream?: MediaStream | null;
  fallbackUser?: { fullName?: string; email?: string } | null;
}

export const MeetingRoomCanvas: React.FC<MeetingRoomCanvasProps> = ({
  layoutMode,
  localParticipant,
  remoteParticipants,
  activeSpeakers,
  pinnedParticipantId,
  onTogglePin,
  raisedHands,
  reactions,
  fallbackStream,
  fallbackUser,
}) => {
  // Combine all participants: local + remotes
  const allParticipants: Array<{
    participant: Participant | null;
    isLocal: boolean;
    identity: string;
  }> = [];

  if (localParticipant) {
    allParticipants.push({
      participant: localParticipant,
      isLocal: true,
      identity: localParticipant.identity,
    });
  } else {
    // If not yet connected to LiveKit room or in local fallback mode
    allParticipants.push({
      participant: null,
      isLocal: true,
      identity: "local-user",
    });
  }

  remoteParticipants.forEach((p) => {
    allParticipants.push({
      participant: p,
      isLocal: false,
      identity: p.identity,
    });
  });

  const totalCount = allParticipants.length;

  // Determine spotlight target (pinned participant, or primary speaker, or first remote, or local)
  const spotlightTarget =
    allParticipants.find((p) => p.identity === pinnedParticipantId) ||
    allParticipants.find((p) =>
      activeSpeakers.some((s) => s.identity === p.identity)
    ) ||
    allParticipants.find((p) => !p.isLocal) ||
    allParticipants[0];

  const sidebarOthers = allParticipants.filter(
    (p) => p.identity !== spotlightTarget?.identity
  );

  const isHandRaised = (identity: string) =>
    raisedHands.some((h) => h.participantId === identity);

  return (
    <div className="relative flex-1 w-full h-full p-3 sm:p-4 md:p-6 overflow-hidden flex items-center justify-center bg-[#202124]">
      {/* Floating Reactions Overlay (Bottom-Left) */}
      <div className="absolute bottom-4 left-6 z-30 pointer-events-none flex flex-col gap-2 max-w-xs">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-neutral-700/80 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
          >
            <span className="text-2xl animate-bounce">{r.emoji}</span>
            <span className="text-xs text-neutral-200 font-medium truncate">
              {r.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Mode 1: Spotlight */}
      {layoutMode === "spotlight" && spotlightTarget && (
        <div className="w-full h-full max-w-6xl max-h-[85vh] flex items-center justify-center">
          {spotlightTarget.participant ? (
            <ParticipantTile
              participant={spotlightTarget.participant}
              isLocal={spotlightTarget.isLocal}
              isPinned={pinnedParticipantId === spotlightTarget.identity}
              onTogglePin={onTogglePin}
              isHandRaised={isHandRaised(spotlightTarget.identity)}
              fallbackStream={spotlightTarget.isLocal ? fallbackStream : null}
            />
          ) : (
            /* Local fallback before room is connected */
            <div className="w-full h-full bg-[#3c4043] rounded-2xl overflow-hidden flex items-center justify-center border border-neutral-700/60 relative">
              {fallbackStream ? (
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={(el) => {
                    if (el) el.srcObject = fallbackStream;
                  }}
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-semibold text-white shadow-lg">
                  {fallbackUser?.fullName?.charAt(0).toUpperCase() || "Y"}
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1.5 rounded-full text-xs text-white">
                {fallbackUser?.fullName || "You"} (You)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Sidebar */}
      {layoutMode === "sidebar" && spotlightTarget && (
        <div className="w-full h-full flex flex-col md:flex-row gap-4 items-center justify-center">
          {/* Main Stage */}
          <div className="flex-1 w-full h-full max-h-[85vh] flex items-center justify-center">
            {spotlightTarget.participant ? (
              <ParticipantTile
                participant={spotlightTarget.participant}
                isLocal={spotlightTarget.isLocal}
                isPinned={pinnedParticipantId === spotlightTarget.identity}
                onTogglePin={onTogglePin}
                isHandRaised={isHandRaised(spotlightTarget.identity)}
                fallbackStream={spotlightTarget.isLocal ? fallbackStream : null}
              />
            ) : (
              <div className="w-full h-full bg-[#3c4043] rounded-2xl flex items-center justify-center border border-neutral-700 relative">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-semibold text-white">
                  {fallbackUser?.fullName?.charAt(0).toUpperCase() || "Y"}
                </div>
              </div>
            )}
          </div>

          {/* Right vertical thumbnail strip */}
          {sidebarOthers.length > 0 && (
            <div className="w-full md:w-64 md:h-full max-h-[85vh] overflow-y-auto flex md:flex-col gap-3 py-2 shrink-0">
              {sidebarOthers.map((item) => (
                <div key={item.identity} className="aspect-video w-48 md:w-full shrink-0">
                  {item.participant ? (
                    <ParticipantTile
                      participant={item.participant}
                      isLocal={item.isLocal}
                      isPinned={pinnedParticipantId === item.identity}
                      onTogglePin={onTogglePin}
                      isHandRaised={isHandRaised(item.identity)}
                      fallbackStream={item.isLocal ? fallbackStream : null}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Tiled Grid (Auto-grid) */}
      {layoutMode === "tiled" && (
        <div
          className={`w-full h-full max-h-[85vh] grid gap-3 sm:gap-4 place-items-center items-center justify-center ${
            totalCount === 1
              ? "grid-cols-1 max-w-4xl"
              : totalCount === 2
              ? "grid-cols-1 md:grid-cols-2 max-w-5xl"
              : totalCount <= 4
              ? "grid-cols-2 max-w-5xl"
              : totalCount <= 6
              ? "grid-cols-2 md:grid-cols-3 max-w-6xl"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-7xl"
          }`}
        >
          {allParticipants.map((item) => (
            <div
              key={item.identity}
              className="w-full h-full min-h-[180px] max-h-[70vh] aspect-video flex items-center justify-center"
            >
              {item.participant ? (
                <ParticipantTile
                  participant={item.participant}
                  isLocal={item.isLocal}
                  isPinned={pinnedParticipantId === item.identity}
                  onTogglePin={onTogglePin}
                  isHandRaised={isHandRaised(item.identity)}
                  fallbackStream={item.isLocal ? fallbackStream : null}
                />
              ) : (
                <div className="w-full h-full bg-[#3c4043] rounded-2xl overflow-hidden flex items-center justify-center border border-neutral-700/60 relative">
                  {fallbackStream ? (
                    <video
                      autoPlay
                      playsInline
                      muted
                      ref={(el) => {
                        if (el) el.srcObject = fallbackStream;
                      }}
                      className="w-full h-full object-cover -scale-x-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-semibold text-white shadow-lg">
                      {fallbackUser?.fullName?.charAt(0).toUpperCase() || "Y"}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1.5 rounded-full text-xs text-white">
                    {fallbackUser?.fullName || "You"} (You)
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeetingRoomCanvas;
