import { useState, useEffect, useCallback } from "react";
import { useMeetStore } from "../store/meet.store";

export interface DeviceOption {
  deviceId: string;
  label: string;
  groupId?: string;
}

export interface UseDevicesReturn {
  audioInputs: DeviceOption[];
  videoInputs: DeviceOption[];
  audioOutputs: DeviceOption[];
  selectedAudioInput: string | null;
  selectedVideoInput: string | null;
  selectedAudioOutput: string | null;
  selectAudioInput: (id: string) => void;
  selectVideoInput: (id: string) => void;
  selectAudioOutput: (id: string) => void;
  refreshDevices: () => Promise<void>;
  hasAudioPermission: boolean;
  hasVideoPermission: boolean;
}

export function useDevices(): UseDevicesReturn {
  const [audioInputs, setAudioInputs] = useState<DeviceOption[]>([]);
  const [videoInputs, setVideoInputs] = useState<DeviceOption[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<DeviceOption[]>([]);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [hasVideoPermission, setHasVideoPermission] = useState(false);

  const selectedAudioInput = useMeetStore((state) => state.selectedAudioInputId);
  const selectedVideoInput = useMeetStore((state) => state.selectedVideoInputId);
  const selectedAudioOutput = useMeetStore((state) => state.selectedAudioOutputId);
  const setSelectedAudioInputId = useMeetStore((state) => state.setSelectedAudioInputId);
  const setSelectedVideoInputId = useMeetStore((state) => state.setSelectedVideoInputId);
  const setSelectedAudioOutputId = useMeetStore((state) => state.setSelectedAudioOutputId);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const aInputs: DeviceOption[] = [];
      const vInputs: DeviceOption[] = [];
      const aOutputs: DeviceOption[] = [];

      let hasAudioLabel = false;
      let hasVideoLabel = false;

      let aInCount = 0;
      let vInCount = 0;
      let aOutCount = 0;

      devices.forEach((device) => {
        if (device.kind === "audioinput") {
          aInCount++;
          if (device.label) hasAudioLabel = true;
          aInputs.push({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${aInCount}`,
            groupId: device.groupId,
          });
        } else if (device.kind === "videoinput") {
          vInCount++;
          if (device.label) hasVideoLabel = true;
          vInputs.push({
            deviceId: device.deviceId,
            label: device.label || `Camera ${vInCount}`,
            groupId: device.groupId,
          });
        } else if (device.kind === "audiooutput") {
          aOutCount++;
          aOutputs.push({
            deviceId: device.deviceId,
            label: device.label || `Speaker ${aOutCount}`,
            groupId: device.groupId,
          });
        }
      });

      setAudioInputs(aInputs);
      setVideoInputs(vInputs);
      setAudioOutputs(aOutputs);
      setHasAudioPermission(hasAudioLabel);
      setHasVideoPermission(hasVideoLabel);

      // Set default selected devices if not already chosen
      if (!selectedAudioInput && aInputs.length > 0) {
        setSelectedAudioInputId(aInputs[0].deviceId);
      }
      if (!selectedVideoInput && vInputs.length > 0) {
        setSelectedVideoInputId(vInputs[0].deviceId);
      }
      if (!selectedAudioOutput && aOutputs.length > 0) {
        setSelectedAudioOutputId(aOutputs[0].deviceId);
      }
    } catch (err) {
      console.warn("Failed to enumerate media devices:", err);
    }
  }, [
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    setSelectedAudioInputId,
    setSelectedVideoInputId,
    setSelectedAudioOutputId,
  ]);

  useEffect(() => {
    const init = async () => {
      await refreshDevices();
    };
    init();

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
      };
    }
  }, [refreshDevices]);

  return {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    selectAudioInput: setSelectedAudioInputId,
    selectVideoInput: setSelectedVideoInputId,
    selectAudioOutput: setSelectedAudioOutputId,
    refreshDevices,
    hasAudioPermission,
    hasVideoPermission,
  };
}
