import type { FrameRate, StudioProject, Transform } from "@/types/studio";

export const CANVAS_PRESETS = [
  { width: 1280, height: 720, label: "1280 × 720 (HD)" },
  { width: 1920, height: 1080, label: "1920 × 1080 (Full HD)" },
  { width: 2560, height: 1440, label: "2560 × 1440 (QHD)" },
  { width: 3840, height: 2160, label: "3840 × 2160 (4K UHD)" },
] as const;

export const FRAME_RATES = [24, 25, 30, 50, 60, 120] as const satisfies readonly FrameRate[];

export function fitToCanvas(contentWidth: number, contentHeight: number, canvasWidth: number, canvasHeight: number): Pick<Transform, "x" | "y" | "width" | "height"> {
  if (contentWidth <= 0 || contentHeight <= 0) return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  const scale = Math.min(canvasWidth / contentWidth, canvasHeight / contentHeight);
  const width = Math.round(contentWidth * scale);
  const height = Math.round(contentHeight * scale);
  return { x: Math.round((canvasWidth - width) / 2), y: Math.round((canvasHeight - height) / 2), width, height };
}

export function resizeProjectCanvas(project: StudioProject, width: number, height: number): StudioProject {
  const scaleX = width / project.canvas.width;
  const scaleY = height / project.canvas.height;
  for (const source of Object.values(project.sources)) {
    source.transform = {
      ...source.transform,
      x: Math.round(source.transform.x * scaleX),
      y: Math.round(source.transform.y * scaleY),
      width: Math.round(source.transform.width * scaleX),
      height: Math.round(source.transform.height * scaleY),
    };
    if (source.type === "text") source.fontSize = Math.max(8, Math.round(source.fontSize * Math.min(scaleX, scaleY)));
  }
  project.canvas = { ...project.canvas, width, height };
  return project;
}
