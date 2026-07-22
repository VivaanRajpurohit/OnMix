export type SourceType =
  | "display"
  | "webcam"
  | "microphone"
  | "image"
  | "video"
  | "text"
  | "browser"
  | "color"
  | "audio"
  | "group";

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  cropLeft: number;
}

export interface BaseSource {
  id: string;
  type: SourceType;
  name: string;
  sceneId: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  zIndex: number;
  transform: Transform;
  volume: number;
  muted: boolean;
  disconnected?: boolean;
}

export interface TextSource extends BaseSource {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  align: CanvasTextAlign;
  color: string;
  backgroundColor: string;
  padding: number;
}
export interface ColorSource extends BaseSource { type: "color"; color: string }
export interface BrowserSource extends BaseSource { type: "browser"; url: string }
export interface MediaSource extends BaseSource {
  type: "display" | "webcam" | "microphone" | "image" | "video" | "audio";
  deviceId?: string;
  fileName?: string;
  loop?: boolean;
  mirror?: boolean;
  includeSystemAudio?: boolean;
}
export interface GroupSource extends BaseSource { type: "group"; childIds: string[] }
export type StudioSource = TextSource | ColorSource | BrowserSource | MediaSource | GroupSource;

export interface Scene { id: string; name: string; sourceIds: string[] }
export type TransitionType = "cut" | "fade" | "slide-left" | "slide-right" | "dip-black";
export interface StudioProject {
  id: string;
  version: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvas: { width: number; height: number; fps: 24 | 30 | 60 };
  scenes: Scene[];
  sources: Record<string, StudioSource>;
  selectedSceneId: string;
  transition: { type: TransitionType; duration: number };
  audio: { sampleRate: 44100 | 48000; masterVolume: number };
  ui: {
    showGrid: boolean;
    showSafeArea: boolean;
    snap: boolean;
    quickStartDismissed: boolean;
    dockWidths?: number[];
    hiddenDocks?: string[];
  };
}

export interface RecordingResult { blob: Blob; filename: string; duration: number; mimeType: string }
export type SaveState = "saved" | "saving" | "failed";
