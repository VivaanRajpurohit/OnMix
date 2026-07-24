import type { StudioPreferences } from "@/types/studio";

export const DEFAULT_PREFERENCES: StudioPreferences = {
  general: { language: "English", theme: "Dark", uiScale: 100, autosave: true, reopenPrevious: true, confirmRemove: true },
  stream: { serverUrl: "", authToken: "" },
  output: { recordingQuality: "high", fileNamePattern: "StreamForge_{date}_{time}", overwriteProtection: true },
  audio: { channelLayout: "Stereo", meterDecay: "Medium", monitoringDevice: "Default" },
  video: { scaleFilter: "Bicubic" },
  hotkeys: { startStopRecording: "Ctrl+Shift+R", pauseRecording: "Ctrl+Shift+P", studioMode: "Ctrl+Shift+S", transition: "Space", muteMic: "Ctrl+Shift+M" },
  accessibility: { reducedMotion: false, highContrast: false, alwaysShowFocus: true, announceStatus: true },
  advanced: { renderer: "Canvas 2D", hardwareAcceleration: true, colorSpace: "sRGB", persistProject: true, retainMediaMetadata: true },
};

export function createDefaultPreferences(): StudioPreferences {
  return structuredClone(DEFAULT_PREFERENCES);
}
