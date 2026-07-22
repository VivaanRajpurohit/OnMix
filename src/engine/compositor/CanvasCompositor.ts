import { renderSource } from "./SourceRenderer";
import type { StudioProject } from "@/types/studio";

export class CanvasCompositor {
  private raf = 0; private last = 0; private frameTimes: number[] = [];
  constructor(private canvas: HTMLCanvasElement, private getProject: () => StudioProject, private getSceneId: () => string, private onMetrics?: (fps: number, renderMs: number) => void) {}
  start() { if (this.raf) return; this.render(performance.now()); const loop = (time: number) => { this.render(time); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
  render(time = performance.now()) {
    const started = performance.now(), p = this.getProject(), scene = p.scenes.find((s) => s.id === this.getSceneId()) ?? p.scenes[0], ctx = this.canvas.getContext("2d"); if (!ctx) return;
    if (this.canvas.width !== p.canvas.width || this.canvas.height !== p.canvas.height) { this.canvas.width = p.canvas.width; this.canvas.height = p.canvas.height; }
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); ctx.fillStyle = "#111318"; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    scene.sourceIds.map((id) => p.sources[id]).filter(Boolean).sort((a, b) => a.zIndex - b.zIndex).forEach((source) => renderSource(ctx, source));
    if (this.last) { this.frameTimes.push(time - this.last); if (this.frameTimes.length > 30) this.frameTimes.shift(); } this.last = time;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / Math.max(1, this.frameTimes.length); this.onMetrics?.(avg > 0 ? Math.round(1000 / avg) : p.canvas.fps, performance.now() - started);
  }
  capture(fps: number) { return this.canvas.captureStream(fps); }
}
