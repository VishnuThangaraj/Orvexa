import React, { useState, useRef, useEffect } from "react";
import { X, Mic, Volume2, Video, Check } from "lucide-react";
import { useDevices } from "../hooks/useDevices";

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioLevel?: number;
  previewStream?: MediaStream | null;
}

export const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({
  isOpen,
  onClose,
  audioLevel = 0,
  previewStream,
}) => {
  const [activeTab, setActiveTab] = useState<"audio" | "video">("audio");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);

  const {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    selectAudioInput,
    selectVideoInput,
    selectAudioOutput,
  } = useDevices();

  // Attach preview stream to video element when tab is video
  useEffect(() => {
    if (activeTab === "video" && videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [activeTab, previewStream]);

  // Test speaker sound with a gentle dual chime using Web Audio API
  const playTestSound = () => {
    try {
      setIsPlayingTestSound(true);
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.6);

      setTimeout(() => {
        ctx.close().catch(() => {});
        setIsPlayingTestSound(false);
      }, 700);
    } catch {
      setIsPlayingTestSound(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#202124] text-neutral-900 dark:text-neutral-100 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 id="device-settings-title" className="text-xl font-medium tracking-tight">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6">
          <button
            onClick={() => setActiveTab("audio")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition ${
              activeTab === "audio"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            <Mic className="w-4 h-4" />
            Audio
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition ${
              activeTab === "video"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            <Video className="w-4 h-4" />
            Video
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === "audio" ? (
            <div className="space-y-6">
              {/* Microphone */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Microphone
                </label>
                <div className="relative">
                  <select
                    value={selectedAudioInput || ""}
                    onChange={(e) => selectAudioInput(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-800 dark:text-neutral-100"
                  >
                    {audioInputs.length === 0 ? (
                      <option value="">Default Microphone</option>
                    ) : (
                      audioInputs.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Live Mic Test Meter */}
                <div className="mt-2 flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
                  <Mic className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="flex-1">
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-75 rounded-full"
                        style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500 font-mono w-9 text-right shrink-0">
                    {audioLevel > 0 ? `${audioLevel}%` : "Quiet"}
                  </span>
                </div>
              </div>

              {/* Speakers */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Speakers
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedAudioOutput || ""}
                    onChange={(e) => selectAudioOutput(e.target.value)}
                    className="flex-1 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-800 dark:text-neutral-100"
                  >
                    {audioOutputs.length === 0 ? (
                      <option value="">Default Speaker</option>
                    ) : (
                      audioOutputs.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={playTestSound}
                    disabled={isPlayingTestSound}
                    className="flex items-center gap-1.5 px-3 py-2.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 transition shrink-0"
                  >
                    <Volume2 className="w-4 h-4 text-blue-500" />
                    <span>{isPlayingTestSound ? "Playing..." : "Test"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Camera
                </label>
                <select
                  value={selectedVideoInput || ""}
                  onChange={(e) => selectVideoInput(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-800 dark:text-neutral-100"
                >
                  {videoInputs.length === 0 ? (
                    <option value="">Default Camera</option>
                  ) : (
                    videoInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Video Preview */}
              <div className="relative aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
                {!previewStream && (
                  <span className="absolute text-neutral-400 text-sm">Camera preview not available</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceSettingsModal;
