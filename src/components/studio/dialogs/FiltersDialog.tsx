"use client";

import { SlidersHorizontal, Volume2 } from "lucide-react";
import { useStudioStore } from "@/store/studioStore";
import { Modal } from "../common/Modal";

export function FiltersDialog({ onClose }: { onClose(): void }) {
  const id = useStudioStore((state) => state.selectedSourceIds[0]);
  const source = useStudioStore((state) => id ? state.project.sources[id] : undefined);
  const update = useStudioStore((state) => state.updateSource);
  if (!source || !id) return <Modal title="Source Filters" onClose={onClose}><p className="sf-empty-dialog">Select a source before opening filters.</p></Modal>;
  const audioCapable = ["display", "webcam", "microphone", "video", "audio"].includes(source.type);
  return <Modal title={`Filters for ${source.name}`} onClose={onClose} width={620}><div className="sf-filter-layout">
    <nav><button className="active"><SlidersHorizontal/>Color Correction</button>{audioCapable && <button><Volume2/>Gain</button>}</nav>
    <section><h3>Color Correction</h3><label><span>Opacity</span><input type="range" min="0" max="100" value={Math.round(source.opacity * 100)} onChange={(event) => update(id, { opacity: Number(event.target.value) / 100 })}/><output>{Math.round(source.opacity * 100)}%</output></label>{audioCapable && <label><span>Audio gain</span><input type="range" min="0" max="150" value={Math.round(source.volume * 100)} onChange={(event) => update(id, { volume: Number(event.target.value) / 100 })}/><output>{Math.round(source.volume * 100)}%</output></label>}<p className="sf-note">Canvas color-processing filters are applied by the compositor where supported.</p></section>
  </div></Modal>;
}
