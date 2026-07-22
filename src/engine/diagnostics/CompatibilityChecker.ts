export interface CompatibilityItem { name: string; supported: boolean; required: boolean }
export function checkCompatibility(): CompatibilityItem[] {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : undefined;
  return [
    { name: "Camera and microphone", supported: !!navigator.mediaDevices?.getUserMedia, required: true },
    { name: "Display capture", supported: !!navigator.mediaDevices?.getDisplayMedia, required: true },
    { name: "MediaRecorder", supported: typeof MediaRecorder !== "undefined", required: true },
    { name: "Canvas captureStream", supported: !!canvas?.captureStream, required: true },
    { name: "Web Audio", supported: typeof AudioContext !== "undefined", required: true },
    { name: "IndexedDB", supported: typeof indexedDB !== "undefined", required: true },
    { name: "WebCodecs", supported: typeof VideoEncoder !== "undefined", required: false },
    { name: "OffscreenCanvas", supported: typeof OffscreenCanvas !== "undefined", required: false },
  ];
}

