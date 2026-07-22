import { createId } from "./ids";
import type { SourceType, StudioSource } from "@/types/studio";

const visual = new Set<SourceType>(["display", "webcam", "image", "video", "text", "browser", "color", "group"]);

export function createSource(type: SourceType, sceneId: string, zIndex: number): StudioSource {
  const id = createId("source");
  const label: Record<SourceType, string> = { display: "Display Capture", webcam: "Webcam", microphone: "Microphone", image: "Image", video: "Video", text: "Text", browser: "Browser Source", color: "Color Source", audio: "Audio File", group: "Group" };
  const base = {
    id, type, sceneId, name: label[type], visible: true, locked: false, opacity: 1,
    blendMode: "source-over" as GlobalCompositeOperation, zIndex, volume: 1, muted: false,
    transform: { x: visual.has(type) ? 240 : 0, y: visual.has(type) ? 135 : 0, width: visual.has(type) ? 720 : 0, height: visual.has(type) ? 405 : 0, scaleX: 1, scaleY: 1, rotation: 0, cropTop: 0, cropRight: 0, cropBottom: 0, cropLeft: 0 },
  };
  if (type === "text") return { ...base, type, text: "New text", fontFamily: "Arial", fontSize: 64, fontWeight: 600, align: "left", color: "#ffffff", backgroundColor: "transparent", padding: 12 };
  if (type === "color") return { ...base, type, color: "#263244" };
  if (type === "browser") return { ...base, type, url: "https://example.com" };
  if (type === "group") return { ...base, type, childIds: [] };
  return { ...base, type, loop: type === "video" || type === "audio", mirror: type === "webcam", includeSystemAudio: false };
}

