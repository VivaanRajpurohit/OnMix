"use client";
import { useState } from "react";
import { checkCompatibility } from "@/engine/diagnostics/CompatibilityChecker";
import { selectMimeType } from "@/engine/recording/mimeTypes";
import { useStudioStore } from "@/store/studioStore";
import { Modal } from "../common/Modal";

const categories = ["General", "Video", "Audio", "Output", "Hotkeys", "Advanced", "About"] as const;
export function SettingsDialog({ onClose }: { onClose(): void }) {
  const [tab, setTab] = useState<(typeof categories)[number]>("General"), project = useStudioStore((s) => s.project), commit = useStudioStore((s) => s.commit);
  return <Modal title="Settings" onClose={onClose} width={760}><div className="sf-settings"><nav>{categories.map((c) => <button className={tab === c ? "active" : ""} onClick={() => setTab(c)} key={c}>{c}</button>)}</nav><section>
    {tab === "General" && <><h3>General</h3><label className="sf-check"><input type="checkbox" defaultChecked/> Autosave project changes</label><label className="sf-field"><span>UI scale</span><select defaultValue="100"><option>90</option><option>100</option><option>110</option></select></label><label className="sf-field"><span>Theme</span><select disabled><option>Dark</option></select></label></>}
    {tab === "Video" && <><h3>Video</h3><label className="sf-field"><span>Base canvas</span><select value={`${project.canvas.width}x${project.canvas.height}`} onChange={(e) => { const [width, height] = e.target.value.split("x").map(Number); commit((p) => ({ ...p, canvas: { ...p.canvas, width, height } })); }}><option value="1920x1080">1920 × 1080</option><option value="1280x720">1280 × 720</option><option value="1080x1920">1080 × 1920</option><option value="1080x1080">1080 × 1080</option></select></label><label className="sf-field"><span>Target FPS</span><select value={project.canvas.fps} onChange={(e) => commit((p) => ({ ...p, canvas: { ...p.canvas, fps: Number(e.target.value) as 24|30|60 } }))}><option>24</option><option>30</option><option>60</option></select></label></>}
    {tab === "Audio" && <><h3>Audio</h3><label className="sf-field"><span>Sample rate</span><select value={project.audio.sampleRate}><option>48000</option><option>44100</option></select></label><p className="sf-note">Source monitoring is off by default to prevent feedback.</p></>}
    {tab === "Output" && <><h3>Recording</h3><label className="sf-field"><span>Detected format</span><input readOnly value={selectMimeType() ?? "Unsupported"}/></label><label className="sf-field"><span>Chunk interval</span><input readOnly value="1000 ms"/></label><p className="sf-warning">Recording formats depend on browser support. RTMP output needs a separate, secure server-side WebRTC gateway.</p><button disabled>Streaming Output — backend not configured</button></>}
    {tab === "Hotkeys" && <><h3>Keyboard shortcuts</h3><div className="sf-shortcuts">{[["Save","Ctrl/⌘ S"],["Undo","Ctrl/⌘ Z"],["Duplicate","Ctrl/⌘ D"],["Delete source","Delete"],["Move source","Arrow keys"],["Toggle lock","L"],["Fit preview","Ctrl/⌘ 0"]].map(([a,b]) => <p key={a}><span>{a}</span><kbd>{b}</kbd></p>)}</div></>}
    {tab === "Advanced" && <><h3>Browser capabilities</h3>{checkCompatibility().map((c) => <p className="sf-compat" key={c.name}><span>{c.name}{!c.required && " (enhancement)"}</span><b className={c.supported ? "ok" : "bad"}>{c.supported ? "Available" : "Unavailable"}</b></p>)}</>}
    {tab === "About" && <><h3>StreamForge Studio</h3><p>Version 0.1.0</p><p className="sf-note">A local-first browser broadcasting and recording studio. No captured content is uploaded.</p></>}
  </section></div></Modal>;
}

