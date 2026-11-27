import React, { useState } from "react";
import { X, Search, Shield, UserCheck, UserX, MicOff } from "lucide-react";
import { useMeetStore } from "../../store/meet.store";
import type { RemoteParticipant, LocalParticipant } from "livekit-client";
import type { FallbackParticipantTileData } from "../../types/meet.types";

interface PeoplePanelProps {
  isHost: boolean;
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
  localFallbackTile?: FallbackParticipantTileData | null;
  remoteFallbackPeers?: FallbackParticipantTileData[];
  onAdmit: (userId: string) => void;
  onDeny: (userId: string) => void;
  onAdmitAll: () => void;
  onClose: () => void;
}

export const PeoplePanel: React.FC<PeoplePanelProps> = ({
  isHost,
  localParticipant,
  remoteParticipants,
  localFallbackTile,
  remoteFallbackPeers = [],
  onAdmit,
  onDeny,
  onAdmitAll,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const waitingParticipants = useMeetStore((state) => state.waitingParticipants);
  const liveKitData = useMeetStore((state) => state.liveKitData);

  // Parse local and remote participants for list
  const inCallList: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
    isLocal: boolean;
    isMuted: boolean;
    isHost: boolean;
  }> = [];

  if (localParticipant) {
    inCallList.push({
      id: localParticipant.identity,
      name: liveKitData?.participantName || "You",
      isLocal: true,
      isMuted: !localParticipant.isMicrophoneEnabled,
      isHost: isHost,
    });
  } else if (localFallbackTile) {
    inCallList.push({
      id: localFallbackTile.id,
      name: localFallbackTile.name || liveKitData?.participantName || "You",
      avatarUrl: localFallbackTile.avatarUrl,
      isLocal: true,
      isMuted: !localFallbackTile.isMicEnabled,
      isHost: isHost,
    });
  }

  if (remoteParticipants.length > 0) {
    remoteParticipants.forEach((p) => {
      let fullName: string | null = null;
      let avatar: string | null = null;
      let role: string | null = null;
      try {
        const parsed = JSON.parse(p.metadata || "{}") as {
          fullName?: string;
          avatar?: string;
          role?: string;
        };
        fullName = parsed.fullName || null;
        avatar = parsed.avatar || null;
        role = parsed.role || null;
      } catch {
        // ignore
      }
      inCallList.push({
        id: p.identity,
        name: fullName || p.name || "Participant",
        avatarUrl: avatar,
        isLocal: false,
        isMuted: !p.isMicrophoneEnabled,
        isHost: role === "HOST",
      });
    });
  } else {
    remoteFallbackPeers.forEach((p) => {
      inCallList.push({
        id: p.id,
        name: p.name,
        avatarUrl: p.avatarUrl,
        isLocal: false,
        isMuted: !p.isMicEnabled,
        isHost: p.role === "HOST",
      });
    });
  }

  const filteredInCall = inCallList.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-80 sm:w-96 h-full bg-[#202124] border-l border-neutral-800 flex flex-col text-neutral-100 z-30 select-none">
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-800 shrink-0">
        <h3 className="text-base font-medium">People</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          aria-label="Close people panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Waiting Room Section (Host Only) */}
        {isHost && waitingParticipants.length > 0 && (
          <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Waiting to join
                </span>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                  {waitingParticipants.length}
                </span>
              </div>
              {waitingParticipants.length > 1 && (
                <button
                  type="button"
                  onClick={onAdmitAll}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition"
                >
                  Admit all
                </button>
              )}
            </div>

            <div className="divide-y divide-neutral-700/60">
              {waitingParticipants.map((p) => (
                <div
                  key={p.userId}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        p.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium text-neutral-200 truncate">
                      {p.displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAdmit(p.userId)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-full shadow-xs transition flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Admit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeny(p.userId)}
                      className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded-full transition"
                      title="Deny entry"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for people"
            className="w-full bg-neutral-800/90 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* In-Call List */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 px-1">
            <span>In call</span>
            <span>{filteredInCall.length}</span>
          </div>

          <div className="space-y-1">
            {filteredInCall.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-800/60 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      p.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">
                      {p.name}
                      {p.isLocal && " (You)"}
                    </p>
                    {p.isHost && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-semibold">
                        <Shield className="w-3 h-3" />
                        Meeting host
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {p.isMuted && (
                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-red-400">
                      <MicOff className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PeoplePanel;
