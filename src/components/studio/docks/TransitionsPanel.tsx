"use client";

import { useStudioStore } from "@/store/studioStore";
import type { TransitionType } from "@/types/studio";
import { Panel } from "./Panel";

export function TransitionsPanel() {
  const transition = useStudioStore((s) => s.project.transition);
  const studioMode = useStudioStore((s) => s.studioMode);
  const commit = useStudioStore((s) => s.commit);
  const go = useStudioStore((s) => s.transitionToPreview);
  return <Panel title="Scene Transitions"><div className="sf-transition">
    <label><span>Transition</span><select value={transition.type} onChange={(event) => commit((project) => ({ ...project, transition: { ...project.transition, type: event.target.value as TransitionType } }))}><option value="cut">Cut</option><option value="fade">Fade</option><option value="slide-left">Slide Left</option><option value="slide-right">Slide Right</option><option value="dip-black">Dip to Black</option></select></label>
    <label><span>Duration</span><div><input aria-label="Transition duration" type="number" min="0" max="5000" value={transition.duration} onChange={(event) => commit((project) => ({ ...project, transition: { ...project.transition, duration: Number(event.target.value) } }))}/><small>ms</small></div></label>
    {studioMode && <button className="sf-transition-action" onClick={go}>Transition</button>}
  </div></Panel>;
}
