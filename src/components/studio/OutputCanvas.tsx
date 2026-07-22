"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CanvasCompositor } from "@/engine/compositor/CanvasCompositor";
import { snapPosition } from "@/lib/geometry";
import { useStudioStore } from "@/store/studioStore";

export function OutputCanvas({ sceneId, label, interactive = true, zoom = "fit", onCanvas, onMetrics }: { sceneId: string; label?: string; interactive?: boolean; zoom?: "fit" | number; onCanvas?(canvas: HTMLCanvasElement): void; onMetrics?(fps: number, render: number): void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null), stageRef = useRef<HTMLDivElement>(null), onCanvasRef = useRef(onCanvas), onMetricsRef = useRef(onMetrics);
  useEffect(() => { onCanvasRef.current = onCanvas; onMetricsRef.current = onMetrics; }, [onCanvas, onMetrics]);
  const project = useStudioStore((s) => s.project), selected = useStudioStore((s) => s.selectedSourceIds[0]), selectSource = useStudioStore((s) => s.selectSource), updateTransform = useStudioStore((s) => s.updateTransform);
  const [drag, setDrag] = useState<{ id: string; startX: number; startY: number; x: number; y: number; width: number; height: number; mode: "move" | "resize" }>();
  const [stageSize, setStageSize] = useState({ width: 1000, height: 560 });
  const source = selected ? project.sources[selected] : undefined;
  const scale = useMemo(() => zoom === "fit" ? Math.max(0.08, Math.min(1, (stageSize.width - 72) / project.canvas.width, (stageSize.height - 54) / project.canvas.height)) : zoom / 100, [project.canvas, stageSize, zoom]);
  useLayoutEffect(() => { const stage = stageRef.current; if (!stage) return; const observer = new ResizeObserver(([entry]) => setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height })); observer.observe(stage); return () => observer.disconnect(); }, []);
  useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; onCanvasRef.current?.(canvas); const comp = new CanvasCompositor(canvas, () => useStudioStore.getState().project, () => sceneId, (fps, render) => onMetricsRef.current?.(fps, render)); comp.start(); return () => comp.stop(); }, [sceneId]);
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag((d) => d ? { ...d, x: d.x + (e.clientX - d.startX) / scale, y: d.y + (e.clientY - d.startY) / scale, startX: e.clientX, startY: e.clientY } : d);
    const up = (e: PointerEvent) => { const d = drag; let x = d.x, y = d.y, width = d.width, height = d.height; if (d.mode === "resize") { width = Math.max(40, d.width + d.x - source!.transform.x); height = Math.max(30, d.height + d.y - source!.transform.y); x = source!.transform.x; y = source!.transform.y; } else if (project.ui.snap && !e.shiftKey) ({ x, y } = snapPosition(x, y, width, height, project.canvas.width, project.canvas.height)); updateTransform(d.id, { x, y, width, height }); setDrag(undefined); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up, { once: true }); return () => window.removeEventListener("pointermove", move);
  }, [drag, project, scale, source, updateTransform]);
  const begin = (e: React.PointerEvent, mode: "move"|"resize") => { if (!source || source.locked) return; e.preventDefault(); e.stopPropagation(); const t = source.transform; setDrag({ id: source.id, startX: e.clientX, startY: e.clientY, x: t.x, y: t.y, width: t.width, height: t.height, mode }); };
  const shown = drag && source ? { ...source.transform, x: drag.x, y: drag.y, width: drag.mode === "resize" ? Math.max(40, drag.width + drag.x - source.transform.x) : drag.width, height: drag.mode === "resize" ? Math.max(30, drag.height + drag.y - source.transform.y) : drag.height } : source?.transform;
  return <div className="sf-canvas-stage" ref={stageRef} onPointerDown={() => interactive && selectSource()}>{label && <span className="sf-pane-label">{label}</span>}<div className="sf-canvas-frame" style={{ width: project.canvas.width * scale, height: project.canvas.height * scale }}>
    <canvas ref={canvasRef} className="sf-output-canvas" aria-label={`${label ?? "Output"} canvas`} style={{ width: project.canvas.width * scale, height: project.canvas.height * scale }}/>
    {project.ui.showGrid && <div className="sf-grid-overlay"/>}{project.ui.showSafeArea && <div className="sf-safe-overlay"/>}
    {interactive && source && shown && source.sceneId === sceneId && source.type !== "microphone" && source.type !== "audio" && <div className={`sf-selection ${source.locked ? "locked" : ""}`} onPointerDown={(e) => begin(e, "move")} style={{ left: shown.x * scale, top: shown.y * scale, width: shown.width * scale, height: shown.height * scale, transform: `rotate(${shown.rotation}deg)` }}><span>{source.name}{source.locked ? " · Locked" : ""}</span>{!source.locked && <><i className="h nw"/><i className="h ne"/><i className="h sw"/><i className="h se" onPointerDown={(e) => begin(e, "resize")}/><i className="rotate"/></>}</div>}
  </div></div>;
}
