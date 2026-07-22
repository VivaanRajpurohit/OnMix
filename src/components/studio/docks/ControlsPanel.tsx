"use client";

import { useStudioStore } from "@/store/studioStore";
import { Panel } from "./Panel";

export function ControlsPanel({ onRecord, onPause, onSettings, onExit }: { onRecord(): void; onPause(): void; onSettings(): void; onExit(): void }) {
  const recording = useStudioStore((s) => s.recording);
  const studioMode = useStudioStore((s) => s.studioMode);
  const setStudioMode = useStudioStore((s) => s.setStudioMode);
  return <Panel title="Controls" className="sf-controls"><div className="sf-control-stack">
    <button disabled title="Streaming requires a configured server-side WebRTC to RTMP gateway">Start Streaming (Backend Required)</button>
    <button className={recording.state !== "idle" ? "danger" : ""} onClick={onRecord}>{recording.state === "idle" ? "Start Recording" : "Stop Recording"}</button>
    {recording.state !== "idle" && <button onClick={onPause}>{recording.state === "paused" ? "Resume Recording" : "Pause Recording"}</button>}
    <button disabled title="Browsers cannot expose a system virtual-camera device">Start Virtual Camera</button>
    <button className={studioMode ? "active" : ""} onClick={() => setStudioMode(!studioMode)}>Studio Mode</button>
    <button onClick={onSettings}>Settings</button>
    <button onClick={onExit}>Exit</button>
  </div></Panel>;
}

