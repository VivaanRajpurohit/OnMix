"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlertTriangle, Check, Minus, Plus, Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { audioEngine } from "@/engine/media/AudioEngine";
import { deviceManager } from "@/engine/media/DeviceManager";
import { mediaRegistry } from "@/engine/media/MediaRuntimeRegistry";
import { projectRepository } from "@/engine/persistence/ProjectRepository";
import { recorderEngine } from "@/engine/recording/RecorderEngine";
import { projectSchema } from "@/lib/validation";
import { useStudioStore } from "@/store/studioStore";
import type { RecordingResult, SourceType, StudioProject } from "@/types/studio";
import { DesktopMenu, type MenuAction } from "./common/DesktopMenu";
import { Modal } from "./common/Modal";
import { AddSourceDialog } from "./dialogs/AddSourceDialog";
import { FiltersDialog } from "./dialogs/FiltersDialog";
import { SettingsDialog } from "./dialogs/SettingsDialog";
import { AudioMixerPanel } from "./docks/AudioMixerPanel";
import { ControlsPanel } from "./docks/ControlsPanel";
import { DockRegion, type DockItem } from "./docks/DockRegion";
import { ScenesPanel } from "./docks/ScenesPanel";
import { SourcesPanel } from "./docks/SourcesPanel";
import { TransitionsPanel } from "./docks/TransitionsPanel";
import { OutputCanvas } from "./OutputCanvas";
import { PropertiesPanel } from "./PropertiesPanel";

type Dialog = "add" | "settings" | "filters" | "properties" | "compat" | "permission" | "about" | "recording" | null;
interface Toast { id: number; text: string; kind?: "error" | "info" }
const subscribeToBrowserCapabilities = () => () => undefined;
const getAudioSupportSnapshot = () => typeof AudioContext !== "undefined";
const getServerAudioSupportSnapshot = () => false;
const DEFAULT_DOCK_WIDTHS = [26, 22, 26, 11, 15];

export function StudioShell() {
  const project = useStudioStore((state) => state.project);
  const saveState = useStudioStore((state) => state.saveState);
  const studioMode = useStudioStore((state) => state.studioMode);
  const previewSceneId = useStudioStore((state) => state.previewSceneId);
  const programSceneId = useStudioStore((state) => state.programSceneId);
  const recording = useStudioStore((state) => state.recording);
  const selectedSourceId = useStudioStore((state) => state.selectedSourceIds[0]);
  const selectedSource = selectedSourceId ? project.sources[selectedSourceId] : undefined;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pendingType, setPendingType] = useState<SourceType>();
  const [result, setResult] = useState<RecordingResult>();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [renderTime, setRenderTime] = useState(0);
  const [loaded, setLoaded] = useState(true);
  const [previewZoom, setPreviewZoom] = useState<"fit" | number>("fit");
  const audioSupported = useSyncExternalStore(subscribeToBrowserCapabilities, getAudioSupportSnapshot, getServerAudioSupportSnapshot);
  const outputCanvas = useRef<HTMLCanvasElement | undefined>(undefined);
  const importRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const elapsedTimer = useRef<number | null>(null);

  const notify = useCallback((text: string, kind: Toast["kind"] = "info") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, text, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  }, []);

  useEffect(() => {
    let active = true;
    const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 1500));
    Promise.race([projectRepository.load(), timeout])
      .then((saved) => { if (active && saved) useStudioStore.getState().setProject(saved); })
      .catch(() => { if (active) notify("IndexedDB is unavailable. Changes will not persist.", "error"); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; mediaRegistry.clear(); audioEngine.dispose(); };
  }, [notify]);

  useEffect(() => {
    if (!loaded || saveState !== "saving") return;
    const timer = window.setTimeout(async () => {
      try { await projectRepository.save(useStudioStore.getState().project); useStudioStore.getState().setSaveState("saved"); }
      catch { useStudioStore.getState().setSaveState("failed"); notify("Project save failed. Check browser storage permissions.", "error"); }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [loaded, notify, project.updatedAt, saveState]);

  useEffect(() => {
    if (recording.state === "recording") elapsedTimer.current = window.setInterval(() => { const current = useStudioStore.getState().recording; useStudioStore.getState().setRecording({ ...current, elapsed: current.elapsed + 1 }); }, 1000);
    else if (elapsedTimer.current) window.clearInterval(elapsedTimer.current);
    return () => { if (elapsedTimer.current) window.clearInterval(elapsedTimer.current); };
  }, [recording.state]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (useStudioStore.getState().recording.state !== "idle") event.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  const save = useCallback(async () => {
    try { useStudioStore.getState().setSaveState("saving"); await projectRepository.save(useStudioStore.getState().project); useStudioStore.getState().setSaveState("saved"); }
    catch { useStudioStore.getState().setSaveState("failed"); notify("Project save failed.", "error"); }
  }, [notify]);

  const exportProject = useCallback(() => {
    const blob = new Blob([JSON.stringify(useStudioStore.getState().project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name.replace(/[^a-z0-9-_]+/gi, "_")}.streamforge.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [project.name]);

  const importProject = async (file?: File) => {
    if (!file) return;
    try { useStudioStore.getState().setProject(projectSchema.parse(JSON.parse(await file.text())) as StudioProject); notify("Project imported successfully."); }
    catch { notify("Import failed. The file is not a valid StreamForge project.", "error"); }
  };

  const addSource = (type: SourceType) => {
    setDialog(null);
    if (["display", "webcam", "microphone"].includes(type)) { setPendingType(type); setDialog("permission"); return; }
    if (["image", "video", "audio"].includes(type)) { setPendingType(type); mediaRef.current?.click(); return; }
    useStudioStore.getState().addSource(type);
  };

  const capture = async () => {
    if (!pendingType) return;
    setDialog(null);
    let id: string | undefined;
    try {
      const stream = pendingType === "display" ? await deviceManager.display(false) : pendingType === "webcam" ? await deviceManager.webcam() : await deviceManager.microphone();
      id = useStudioStore.getState().addSource(pendingType);
      const video = pendingType !== "microphone" ? document.createElement("video") : undefined;
      if (video) { video.srcObject = stream; video.muted = true; video.playsInline = true; await video.play(); }
      mediaRegistry.set(id, { stream, element: video });
      if (stream.getAudioTracks().length) audioEngine.attach(id);
      stream.getTracks().forEach((track) => track.addEventListener("ended", () => useStudioStore.getState().updateSource(id!, { disconnected: true })));
      notify(`${pendingType === "display" ? "Display" : pendingType === "webcam" ? "Camera" : "Microphone"} capture started.`);
    } catch (error) {
      if (id) useStudioStore.getState().removeSelectedSources();
      notify(error instanceof DOMException && error.name === "NotAllowedError" ? "Permission was denied or the capture picker was canceled." : "The selected device is unavailable. Check browser permissions.", "error");
    } finally { setPendingType(undefined); }
  };

  const addMedia = async (file?: File) => {
    if (!file || !pendingType) return;
    const type = pendingType;
    const id = useStudioStore.getState().addSource(type);
    const url = URL.createObjectURL(file);
    if (type === "image") {
      const image = new Image(); image.src = url; await image.decode(); mediaRegistry.set(id, { element: image, objectUrl: url }); useStudioStore.getState().updateTransform(id, { width: image.naturalWidth, height: image.naturalHeight });
    } else {
      const element = document.createElement(type === "audio" ? "audio" : "video"); element.src = url; element.loop = true;
      if (type === "video") { (element as HTMLVideoElement).muted = true; (element as HTMLVideoElement).playsInline = true; }
      await element.play().catch(() => undefined);
      mediaRegistry.set(id, { element, objectUrl: url });
      if (type === "audio") { const stream = (element as HTMLAudioElement & { captureStream?: () => MediaStream }).captureStream?.(); if (stream) { mediaRegistry.set(id, { element, objectUrl: url, stream }); audioEngine.attach(id); } }
    }
    useStudioStore.getState().updateSource(id, { fileName: file.name } as never);
    setPendingType(undefined);
  };

  const record = async () => {
    if (recording.state === "idle") {
      try {
        const canvas = outputCanvas.current;
        if (!canvas?.captureStream) throw new Error("Canvas recording is unavailable.");
        audioEngine.init(project.audio.sampleRate);
        const video = canvas.captureStream(project.canvas.fps);
        recorderEngine.start(new MediaStream([...video.getVideoTracks(), ...audioEngine.stream().getAudioTracks()]));
        useStudioStore.getState().setRecording({ state: "recording", elapsed: 0 });
        notify("Recording started. Output remains local.");
      } catch (error) { notify(error instanceof Error ? error.message : "Recording could not start.", "error"); }
    } else {
      try { setResult(await recorderEngine.stop()); useStudioStore.getState().setRecording({ state: "idle", elapsed: 0 }); setDialog("recording"); }
      catch { notify("Recording failed while stopping.", "error"); }
    }
  };

  const pause = () => {
    if (recording.state === "recording") { recorderEngine.pause(); useStudioStore.getState().setRecording({ ...recording, state: "paused" }); }
    else if (recording.state === "paused") { recorderEngine.resume(); useStudioStore.getState().setRecording({ ...recording, state: "recording" }); }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = result.filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setDialog(null);
  };

  useEffect(() => {
    const hotkeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;
      const mod = event.ctrlKey || event.metaKey;
      const store = useStudioStore.getState();
      const id = store.selectedSourceIds[0];
      const source = id ? store.project.sources[id] : undefined;
      if (mod && event.key.toLowerCase() === "s") { event.preventDefault(); void save(); }
      else if (mod && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) store.redo(); else store.undo(); }
      else if (mod && event.key.toLowerCase() === "d") { event.preventDefault(); store.duplicateSelected(); }
      else if (mod && event.key.toLowerCase() === "c") store.copy();
      else if (mod && event.key.toLowerCase() === "v") store.paste();
      else if (event.key === "Delete") store.removeSelectedSources();
      else if (event.key.toLowerCase() === "l" && source) store.updateSource(id, { locked: !source.locked });
      else if (event.key.toLowerCase() === "f" && source) store.updateTransform(id, { x: 0, y: 0, width: store.project.canvas.width, height: store.project.canvas.height });
      else if (event.key.startsWith("Arrow") && source && !source.locked) { event.preventDefault(); const amount = event.shiftKey ? 10 : 1; const dx = event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0; const dy = event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0; store.updateTransform(id, { x: source.transform.x + dx, y: source.transform.y + dy }); }
      else if (event.key === "Escape") store.selectSource();
    };
    document.addEventListener("keydown", hotkeys);
    return () => document.removeEventListener("keydown", hotkeys);
  }, [save]);

  const setResolution = (width: number, height: number) => useStudioStore.getState().commit((current) => ({ ...current, canvas: { ...current.canvas, width, height } }));
  const toggleDock = (id: string) => useStudioStore.getState().commit((current) => { const hidden = current.ui.hiddenDocks ?? []; return { ...current, ui: { ...current.ui, hiddenDocks: hidden.includes(id) ? hidden.filter((dock) => dock !== id) : [...hidden, id] } }; });
  const resetDockLayout = () => useStudioStore.getState().commit((current) => ({ ...current, ui: { ...current.ui, dockWidths: DEFAULT_DOCK_WIDTHS, hiddenDocks: [] } }));
  const fileMenu: MenuAction[] = [{ label: "New Project", shortcut: "Ctrl+N", action: () => useStudioStore.getState().newProject() }, { label: "Open Project", action: () => importRef.current?.click() }, { label: "Save Project", shortcut: "Ctrl+S", action: () => void save() }, { label: "Save Project As", action: exportProject }, { label: "", divider: true }, { label: "Import Project", action: () => importRef.current?.click() }, { label: "Export Project", action: exportProject }, { label: "Settings", action: () => setDialog("settings") }];
  const editMenu: MenuAction[] = [{ label: "Undo", shortcut: "Ctrl+Z", action: () => useStudioStore.getState().undo() }, { label: "Redo", shortcut: "Ctrl+Shift+Z", action: () => useStudioStore.getState().redo() }, { label: "", divider: true }, { label: "Copy", shortcut: "Ctrl+C", action: () => useStudioStore.getState().copy() }, { label: "Paste", shortcut: "Ctrl+V", action: () => useStudioStore.getState().paste() }, { label: "Duplicate", shortcut: "Ctrl+D", action: () => useStudioStore.getState().duplicateSelected() }, { label: "Remove", shortcut: "Delete", action: () => useStudioStore.getState().removeSelectedSources() }];
  const viewMenu: MenuAction[] = [{ label: "Fullscreen Preview", action: () => document.documentElement.requestFullscreen?.() }, { label: "", divider: true }, { label: `${project.ui.snap ? "✓ " : ""}Snap Sources`, action: () => useStudioStore.getState().commit((current) => ({ ...current, ui: { ...current.ui, snap: !current.ui.snap } })) }, { label: `${project.ui.showGrid ? "✓ " : ""}Thirds Grid`, action: () => useStudioStore.getState().commit((current) => ({ ...current, ui: { ...current.ui, showGrid: !current.ui.showGrid } })) }, { label: `${project.ui.showSafeArea ? "✓ " : ""}Safe Areas`, action: () => useStudioStore.getState().commit((current) => ({ ...current, ui: { ...current.ui, showSafeArea: !current.ui.showSafeArea } })) }, { label: "", divider: true }, { label: "Canvas: 1920 × 1080", action: () => setResolution(1920, 1080) }, { label: "Canvas: 1280 × 720", action: () => setResolution(1280, 720) }];
  const dockNames = [["scenes", "Scenes"], ["sources", "Sources"], ["mixer", "Audio Mixer"], ["transitions", "Scene Transitions"], ["controls", "Controls"]] as const;
  const docksMenu: MenuAction[] = [...dockNames.map(([id, label]) => ({ label: `${project.ui.hiddenDocks?.includes(id) ? "" : "✓ "}${label}`, action: () => toggleDock(id) })), { label: "", divider: true }, { label: "Reset Dock Layout", action: resetDockLayout }];
  const dockItems: DockItem[] = [
    { id: "scenes", content: <ScenesPanel/> },
    { id: "sources", content: <SourcesPanel onAdd={() => setDialog("add")} onProperties={() => selectedSource && setDialog("properties")}/> },
    { id: "mixer", content: <AudioMixerPanel/> },
    { id: "transitions", content: <TransitionsPanel/> },
    { id: "controls", content: <ControlsPanel onRecord={() => void record()} onPause={pause} onSettings={() => setDialog("settings")} onExit={() => { if (confirm("Close this project and stop all media sources?")) { mediaRegistry.clear(); useStudioStore.getState().newProject(); } }}/> },
  ];
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const zoomLabel = previewZoom === "fit" ? "Fit" : `${previewZoom}%`;
  const adjustZoom = (direction: -1 | 1) => { const stops = [25, 50, 75, 100, 150, 200]; const current = previewZoom === "fit" ? 50 : previewZoom; const index = stops.findIndex((value) => value >= current); setPreviewZoom(stops[Math.max(0, Math.min(stops.length - 1, index + direction))]); };

  if (!loaded) return <main className="sf-loading"><div className="sf-logo-mark">SF</div><p>Loading StreamForge Studio…</p></main>;

  return <main className="sf-app">
    <header className="sf-topbar">
      <div className="sf-titlebar"><div className="sf-brand"><span>SF</span>StreamForge Studio — Profile: Default — Scenes: {project.name}</div><div className="sf-title-metrics">FPS {project.canvas.fps} &nbsp;|&nbsp; Render {renderTime.toFixed(1)} ms</div><div className="sf-window-controls" aria-hidden="true"><span>—</span><span>□</span><span>×</span></div></div>
      <nav className="sf-menubar" aria-label="Application menu"><DesktopMenu label="File" items={fileMenu}/><DesktopMenu label="Edit" items={editMenu}/><DesktopMenu label="View" items={viewMenu}/><DesktopMenu label="Docks" items={docksMenu}/><DesktopMenu label="Profile" items={[{ label: "Default", disabled: true }, { label: "Manage Profiles", action: () => setDialog("settings") }]}/><DesktopMenu label="Scene Collection" items={[{ label: "New Collection", action: () => useStudioStore.getState().newProject() }, { label: "Rename Collection", disabled: true }, { label: "Duplicate Collection", disabled: true }]}/><DesktopMenu label="Tools" items={[{ label: "Output Diagnostics", action: () => setDialog("compat") }, { label: "Browser Compatibility", action: () => setDialog("compat") }, { label: "Keyboard Shortcuts", action: () => setDialog("settings") }]}/><DesktopMenu label="Help" items={[{ label: "Documentation", action: () => notify("See README.md for documentation.") }, { label: "Browser Permissions Help", action: () => setDialog("compat") }, { label: "About StreamForge Studio", action: () => setDialog("about") }]}/><span className={`sf-save ${saveState}`}>{saveState === "saving" ? "Saving…" : saveState === "failed" ? "Save failed" : "Saved"}</span></nav>
    </header>
    <section className={`sf-preview ${studioMode ? "studio" : ""}`}>
      {studioMode && <OutputCanvas sceneId={previewSceneId || project.selectedSceneId} label="PREVIEW" zoom={previewZoom}/>} 
      <OutputCanvas sceneId={studioMode ? (programSceneId || project.selectedSceneId) : project.selectedSceneId} label={studioMode ? "PROGRAM" : undefined} interactive={!studioMode} zoom={previewZoom} onCanvas={(canvas) => { outputCanvas.current = canvas; }} onMetrics={(_fps, render) => setRenderTime(render)}/>
      <div className="sf-preview-zoom"><button onClick={() => adjustZoom(-1)} aria-label="Zoom out"><Minus/></button><span>{zoomLabel}</span><button onClick={() => adjustZoom(1)} aria-label="Zoom in"><Plus/></button><select aria-label="Preview scaling" value={previewZoom} onChange={(event) => setPreviewZoom(event.target.value === "fit" ? "fit" : Number(event.target.value))}><option value="fit">Scale to Window</option><option value="25">25%</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option></select></div>
    </section>
    <div className="sf-source-action"><span>{selectedSource ? selectedSource.name : "No source selected"}</span><button disabled={!selectedSource} onClick={() => setDialog("properties")}><Settings/>Properties</button><button disabled={!selectedSource} onClick={() => setDialog("filters")}><SlidersHorizontal/>Filters</button></div>
    <DockRegion items={dockItems}/>
    <footer className="sf-status"><div><span>LIVE: Off</span><span className={recording.state !== "idle" ? "rec" : ""}>{recording.state !== "idle" ? <><i/>REC: {formatTime(recording.elapsed)}</> : "REC: 00:00:00"}</span></div><div><span>Audio: {audioSupported ? "OK" : "Unavailable"}</span><span>Render: {renderTime.toFixed(1)} ms</span><span>{project.canvas.width} × {project.canvas.height}</span><span>{project.canvas.fps.toFixed(2)} / {project.canvas.fps.toFixed(2)} FPS</span><span className="sf-compat-status"><Check/> Ready</span></div></footer>
    <input hidden ref={importRef} type="file" accept="application/json,.json" onChange={(event) => void importProject(event.target.files?.[0])}/><input hidden ref={mediaRef} type="file" accept={pendingType === "image" ? "image/*" : pendingType === "video" ? "video/*" : "audio/*"} onChange={(event) => void addMedia(event.target.files?.[0])}/>
    {dialog === "add" && <AddSourceDialog onAdd={addSource} onClose={() => setDialog(null)}/>} 
    {dialog === "settings" && <SettingsDialog onClose={() => setDialog(null)}/>} 
    {dialog === "filters" && <FiltersDialog onClose={() => setDialog(null)}/>} 
    {dialog === "properties" && <Modal title={selectedSource ? `Properties for ${selectedSource.name}` : "Source Properties"} onClose={() => setDialog(null)} width={700}><PropertiesPanel/></Modal>}
    {dialog === "permission" && <Modal title="Browser permission required" onClose={() => setDialog(null)}><div className="sf-permission"><ShieldCheck/><p>StreamForge will ask the browser for access to your {pendingType}. You choose what to share, and captured media is never uploaded.</p></div><div className="sf-dialog-actions"><button onClick={() => setDialog(null)}>Cancel</button><button className="sf-primary" onClick={() => void capture()}>Continue</button></div></Modal>}
    {dialog === "recording" && result && <Modal title="Recording complete" onClose={() => setDialog(null)}><dl className="sf-recording-result"><div><dt>Filename</dt><dd>{result.filename}</dd></div><div><dt>Duration</dt><dd>{(result.duration / 1000).toFixed(1)} seconds</dd></div><div><dt>Format</dt><dd>{result.mimeType}</dd></div><div><dt>Size</dt><dd>{(result.blob.size / 1024 / 1024).toFixed(2)} MB</dd></div></dl><div className="sf-dialog-actions"><button onClick={() => setDialog(null)}>Discard</button><button className="sf-primary" onClick={download}>Save Recording</button></div></Modal>}
    {dialog === "compat" && <Modal title="Browser compatibility" onClose={() => setDialog(null)}><p className="sf-note">Chrome and Edge provide the most complete capture support. Screen selection always happens in the browser permission dialog. System audio availability varies by platform.</p><button className="sf-primary" onClick={() => setDialog("settings")}>View diagnostics</button></Modal>}
    {dialog === "about" && <Modal title="About StreamForge Studio" onClose={() => setDialog(null)}><div className="sf-about-mark">SF</div><h3>StreamForge Studio 0.1.0</h3><p className="sf-note">An original, local-first browser composition and recording tool. RTMP streaming requires an external backend.</p></Modal>}
    <div className="sf-toasts" aria-live="polite">{toasts.map((toast) => <div className={toast.kind} key={toast.id}>{toast.kind === "error" ? <AlertTriangle/> : <Check/>}{toast.text}</div>)}</div><div className="sf-small-warning"><AlertTriangle/>StreamForge Studio requires a desktop viewport of at least 1280 px.</div>
  </main>;
}
