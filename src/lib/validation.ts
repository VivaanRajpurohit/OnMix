import { z } from "zod";

const transform = z.object({ x: z.number(), y: z.number(), width: z.number().nonnegative(), height: z.number().nonnegative(), scaleX: z.number(), scaleY: z.number(), rotation: z.number(), cropTop: z.number().nonnegative(), cropRight: z.number().nonnegative(), cropBottom: z.number().nonnegative(), cropLeft: z.number().nonnegative() });
const source = z.object({ id: z.string(), type: z.enum(["display", "webcam", "microphone", "image", "video", "text", "browser", "color", "audio", "group"]), name: z.string(), sceneId: z.string(), visible: z.boolean(), locked: z.boolean(), opacity: z.number().min(0).max(1), blendMode: z.string(), zIndex: z.number(), transform, volume: z.number(), muted: z.boolean() }).passthrough();
const preferences = z.object({
  general: z.object({ language: z.literal("English"), theme: z.literal("Dark"), uiScale: z.union([z.literal(90), z.literal(100), z.literal(110)]), autosave: z.boolean(), reopenPrevious: z.boolean(), confirmRemove: z.boolean() }),
  stream: z.object({ serverUrl: z.string(), authToken: z.string() }),
  output: z.object({ recordingQuality: z.enum(["balanced", "high", "lossless"]), fileNamePattern: z.string(), overwriteProtection: z.boolean() }),
  audio: z.object({ channelLayout: z.literal("Stereo"), meterDecay: z.enum(["Fast", "Medium", "Slow"]), monitoringDevice: z.literal("Default") }),
  video: z.object({ scaleFilter: z.enum(["Bilinear", "Bicubic", "Lanczos"]) }),
  hotkeys: z.object({ startStopRecording: z.string(), pauseRecording: z.string(), studioMode: z.string(), transition: z.string(), muteMic: z.string() }),
  accessibility: z.object({ reducedMotion: z.boolean(), highContrast: z.boolean(), alwaysShowFocus: z.boolean(), announceStatus: z.boolean() }),
  advanced: z.object({ renderer: z.literal("Canvas 2D"), hardwareAcceleration: z.boolean(), colorSpace: z.enum(["sRGB", "Display P3"]), persistProject: z.boolean(), retainMediaMetadata: z.boolean() }),
});
export const projectSchema = z.object({ id: z.string(), version: z.number().int(), name: z.string(), createdAt: z.string(), updatedAt: z.string(), canvas: z.object({ width: z.number().positive(), height: z.number().positive(), fps: z.union([z.literal(24), z.literal(25), z.literal(30), z.literal(50), z.literal(60), z.literal(120)]) }), scenes: z.array(z.object({ id: z.string(), name: z.string(), sourceIds: z.array(z.string()) })).min(1), sources: z.record(z.string(), source), selectedSceneId: z.string(), transition: z.object({ type: z.enum(["cut", "fade", "slide-left", "slide-right", "dip-black"]), duration: z.number().nonnegative() }), audio: z.object({ sampleRate: z.union([z.literal(44100), z.literal(48000)]), masterVolume: z.number() }), ui: z.object({ showGrid: z.boolean(), showSafeArea: z.boolean(), snap: z.boolean(), quickStartDismissed: z.boolean(), dockWidths: z.array(z.number().positive()).optional(), hiddenDocks: z.array(z.string()).optional(), preferences: preferences.optional() }) });
