import { useState, useEffect, useRef, useCallback } from "react";
import { useMeetStore } from "../store/meet.store";

export interface UseMediaStreamOptions {
  autoStart?: boolean;
}

export interface UseMediaStreamReturn {
  stream: MediaStream | null;
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  audioLevel: number;
  permissionDenied: boolean;
  errorMessage: string | null;
  toggleCamera: () => void;
  toggleMic: () => void;
  startStream: () => Promise<void>;
  stopStream: () => void;
}

export function useMediaStream(options: UseMediaStreamOptions = { autoStart: true }): UseMediaStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMicEnabled = useMeetStore((state) => state.isMicEnabled);
  const isCameraEnabled = useMeetStore((state) => state.isCameraEnabled);
  const selectedAudioInputId = useMeetStore((state) => state.selectedAudioInputId);
  const selectedVideoInputId = useMeetStore((state) => state.selectedVideoInputId);
  const toggleMicStore = useMeetStore((state) => state.toggleMic);
  const toggleCameraStore = useMeetStore((state) => state.toggleCamera);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMicEnabledRef = useRef<boolean>(isMicEnabled);
  const isCameraEnabledRef = useRef<boolean>(isCameraEnabled);

  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);

  useEffect(() => {
    isCameraEnabledRef.current = isCameraEnabled;
  }, [isCameraEnabled]);

  // Stop all active tracks
  const stopStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    setAudioLevel(0);
  }, []);

  // Setup Web Audio Analyser
  const setupAudioAnalyzer = useCallback((mediaStream: MediaStream) => {
    try {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = ctx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!audioContextRef.current || audioContextRef.current.state === "closed") return;

        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const normalized = Math.min(100, Math.round((avg / 64) * 100));
        setAudioLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn("Could not start Web Audio Analyzer:", e);
    }
  }, []);

  // Start media stream
  const startStream = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Media devices not supported in this browser.");
      return;
    }

    stopStream();

    const constraints: MediaStreamConstraints = {
      video: selectedVideoInputId
        ? { deviceId: { exact: selectedVideoInputId } }
        : true,
      audio: selectedAudioInputId
        ? {
            deviceId: { exact: selectedAudioInputId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
    };

    try {
      setErrorMessage(null);
      setPermissionDenied(false);

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
          mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError" ||
          error.name === "NotReadableError"
        ) {
          // Fallback to audio-only or video-only if one device is missing/busy
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          } catch {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
          }
        } else {
          throw err;
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraEnabledRef.current;
      });
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicEnabledRef.current;
      });

      setupAudioAnalyzer(mediaStream);
    } catch (err: unknown) {
      const error = err as Error;
      console.warn("getUserMedia failed:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionDenied(true);
        setErrorMessage("Camera or microphone permission was denied. Please allow access in browser settings.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setErrorMessage("No camera or microphone found on this device.");
      } else {
        setErrorMessage(error.message || "Failed to access camera or microphone.");
      }
    }
  }, [
    selectedAudioInputId,
    selectedVideoInputId,
    stopStream,
    setupAudioAnalyzer,
  ]);

  // Sync track states when store flags change
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isCameraEnabled;
      });
    }
  }, [isCameraEnabled]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMicEnabled;
      });
    }
  }, [isMicEnabled]);

  // Auto-start on mount or device switch
  const autoStart = options.autoStart ?? true;
  useEffect(() => {
    if (!autoStart) return;
    const run = async () => {
      await startStream();
    };
    run();
    return () => {
      stopStream();
    };
  }, [autoStart, startStream, stopStream]);

  return {
    stream,
    isCameraEnabled,
    isMicEnabled,
    audioLevel: isMicEnabled ? audioLevel : 0,
    permissionDenied,
    errorMessage,
    toggleCamera: toggleCameraStore,
    toggleMic: toggleMicStore,
    startStream,
    stopStream,
  };
}
