import type { Transform } from "@/types/studio";

export const clampCrop = (value: number, size: number) => Math.max(0, Math.min(value, Math.max(0, size - 1)));

export function snapPosition(x: number, y: number, width: number, height: number, canvasWidth: number, canvasHeight: number, threshold = 10) {
  const targetsX = [0, (canvasWidth - width) / 2, canvasWidth - width];
  const targetsY = [0, (canvasHeight - height) / 2, canvasHeight - height];
  return {
    x: targetsX.find((v) => Math.abs(v - x) <= threshold) ?? x,
    y: targetsY.find((v) => Math.abs(v - y) <= threshold) ?? y,
  };
}

export const visibleRect = (t: Transform) => ({
  x: t.x, y: t.y,
  width: Math.max(1, t.width - clampCrop(t.cropLeft, t.width) - clampCrop(t.cropRight, t.width)),
  height: Math.max(1, t.height - clampCrop(t.cropTop, t.height) - clampCrop(t.cropBottom, t.height)),
});

