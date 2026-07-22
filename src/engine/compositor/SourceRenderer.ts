import { mediaRegistry } from "../media/MediaRuntimeRegistry";
import type { StudioSource } from "@/types/studio";

export function renderSource(ctx: CanvasRenderingContext2D, source: StudioSource) {
  if (!source.visible || source.type === "microphone" || source.type === "audio" || source.type === "group") return;
  const t = source.transform;
  ctx.save();
  ctx.globalAlpha = source.opacity; ctx.globalCompositeOperation = source.blendMode;
  ctx.translate(t.x + t.width / 2, t.y + t.height / 2); ctx.rotate(t.rotation * Math.PI / 180); ctx.scale(t.scaleX, t.scaleY);
  const x = -t.width / 2, y = -t.height / 2;
  ctx.beginPath(); ctx.rect(x + t.cropLeft, y + t.cropTop, Math.max(1, t.width - t.cropLeft - t.cropRight), Math.max(1, t.height - t.cropTop - t.cropBottom)); ctx.clip();
  if (source.type === "color") { ctx.fillStyle = source.color; ctx.fillRect(x, y, t.width, t.height); }
  else if (source.type === "text") {
    if (source.backgroundColor !== "transparent") { ctx.fillStyle = source.backgroundColor; ctx.fillRect(x, y, t.width, t.height); }
    ctx.fillStyle = source.color; ctx.font = `${source.fontWeight} ${source.fontSize}px ${source.fontFamily}`; ctx.textAlign = source.align; ctx.textBaseline = "top";
    const tx = source.align === "center" ? 0 : source.align === "right" ? t.width / 2 - source.padding : x + source.padding;
    source.text.split("\n").forEach((line, i) => ctx.fillText(line, tx, y + source.padding + i * source.fontSize * 1.2, t.width - source.padding * 2));
  } else if (source.type === "browser") {
    ctx.fillStyle = "#f4f4f5"; ctx.fillRect(x, y, t.width, t.height); ctx.fillStyle = "#27272a"; ctx.font = "24px Arial"; ctx.textAlign = "center"; ctx.fillText("Browser Source", 0, -12); ctx.font = "16px Arial"; ctx.fillStyle = "#71717a"; ctx.fillText(source.url, 0, 24, t.width - 40);
  } else {
    const el = mediaRegistry.get(source.id)?.element;
    if (el && !(el instanceof HTMLAudioElement) && ((el instanceof HTMLImageElement && el.complete) || (el instanceof HTMLVideoElement && el.readyState >= 2))) {
      if (source.type === "webcam" && source.mirror) { ctx.scale(-1, 1); ctx.drawImage(el, x, y, t.width, t.height); } else ctx.drawImage(el, x, y, t.width, t.height);
    } else { ctx.fillStyle = "#252a31"; ctx.fillRect(x, y, t.width, t.height); ctx.strokeStyle = "#4b5563"; ctx.strokeRect(x, y, t.width, t.height); ctx.fillStyle = "#9ca3af"; ctx.font = "26px Arial"; ctx.textAlign = "center"; ctx.fillText(source.disconnected ? "Source disconnected" : source.name, 0, 0); }
  }
  ctx.restore();
}
