"use client";

import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AlertTriangle, Check, CircleAlert } from "lucide-react";
import { checkCompatibility } from "@/engine/diagnostics/CompatibilityChecker";
import { selectMimeType } from "@/engine/recording/mimeTypes";
import { CANVAS_PRESETS, FRAME_RATES, resizeProjectCanvas } from "@/lib/videoPresets";
import { createDefaultPreferences } from "@/store/defaultSettings";
import { useStudioStore } from "@/store/studioStore";
import type { FrameRate, StudioPreferences, StudioProject } from "@/types/studio";
import { BrandMark } from "../common/BrandMark";
import { Modal } from "../common/Modal";

const categories = [
  { id: "general", label: "General", description: "Application appearance and project behavior." },
  { id: "stream", label: "Stream", description: "Configure a secure external streaming gateway." },
  { id: "output", label: "Output", description: "Recording quality, naming, and output behavior." },
  { id: "audio", label: "Audio", description: "Sample rate, channels, monitoring, and meters." },
  { id: "video", label: "Video", description: "Base canvas, scaling, and target frame rate." },
  { id: "hotkeys", label: "Hotkeys", description: "Keyboard shortcuts for common studio actions." },
  { id: "accessibility", label: "Accessibility", description: "Motion, contrast, focus, and status announcements." },
  { id: "advanced", label: "Advanced", description: "Renderer, color, storage, and performance options." },
  { id: "about", label: "About", description: "Version, privacy model, and browser capabilities." },
] as const;

const hotkeyRows = [
  ["Start / stop recording", "startStopRecording"],
  ["Pause / resume recording", "pauseRecording"],
  ["Toggle Studio Mode", "studioMode"],
  ["Run transition", "transition"],
  ["Mute microphone", "muteMic"],
] as const;

type Category = (typeof categories)[number]["id"];
type SettingsDraft = {
  general: StudioPreferences["general"];
  stream: StudioPreferences["stream"];
  output: StudioPreferences["output"];
  audio: StudioPreferences["audio"] & { sampleRate: 44100 | 48000 };
  video: StudioPreferences["video"] & { width: number; height: number; fps: FrameRate };
  hotkeys: StudioPreferences["hotkeys"];
  accessibility: StudioPreferences["accessibility"];
  advanced: StudioPreferences["advanced"];
  about: Record<string, never>;
};

function createDraft(project: StudioProject): SettingsDraft {
  const preferences = project.ui.preferences ?? createDefaultPreferences();
  return {
    general: structuredClone(preferences.general),
    stream: structuredClone(preferences.stream),
    output: structuredClone(preferences.output),
    audio: { ...structuredClone(preferences.audio), sampleRate: project.audio.sampleRate },
    video: { ...structuredClone(preferences.video), width: project.canvas.width, height: project.canvas.height, fps: project.canvas.fps },
    hotkeys: structuredClone(preferences.hotkeys),
    accessibility: structuredClone(preferences.accessibility),
    advanced: structuredClone(preferences.advanced),
    about: {},
  };
}

function defaultDraft(): SettingsDraft {
  const preferences = createDefaultPreferences();
  return {
    ...preferences,
    audio: { ...preferences.audio, sampleRate: 48000 },
    video: { ...preferences.video, width: 1920, height: 1080, fps: 30 },
    about: {},
  };
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="sf-settings-group"><h4>{title}</h4><div>{children}</div></section>;
}

function SettingRow({ label, children, help }: { label: string; children: ReactNode; help?: string }) {
  return <label className="sf-settings-row"><span>{label}</span><div>{children}{help && <small>{help}</small>}</div></label>;
}

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange(checked: boolean): void; children: ReactNode }) {
  return <label className="sf-settings-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><span>{children}</span></label>;
}

export function SettingsDialog({ onClose }: { onClose(): void }) {
  const project = useStudioStore((state) => state.project);
  const commit = useStudioStore((state) => state.commit);
  const [category, setCategory] = useState<Category>("general");
  const [draft, setDraft] = useState<SettingsDraft>(() => createDraft(project));
  const [baseline, setBaseline] = useState<SettingsDraft>(() => createDraft(project));
  const navigationRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const dirtyCategories = useMemo(() => new Set<Category>(categories.filter(({ id }) => JSON.stringify(draft[id]) !== JSON.stringify(baseline[id])).map(({ id }) => id)), [baseline, draft]);
  const dirty = dirtyCategories.size > 0;
  const errors = useMemo(() => {
    const next: Array<{ category: Category; message: string }> = [];
    if (!draft.output.fileNamePattern.trim()) next.push({ category: "output", message: "Recording filename pattern cannot be empty." });
    if (draft.stream.serverUrl && !/^https:\/\//i.test(draft.stream.serverUrl)) next.push({ category: "stream", message: "Gateway URL must begin with https://" });
    const assigned = Object.values(draft.hotkeys).map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (new Set(assigned).size !== assigned.length) next.push({ category: "hotkeys", message: "Each assigned hotkey must be unique." });
    return next;
  }, [draft.hotkeys, draft.output.fileNamePattern, draft.stream.serverUrl]);
  const categoryErrors = errors.filter((error) => error.category === category);
  const currentMeta = categories.find((item) => item.id === category)!;

  const update = <K extends Category>(key: K, patch: Partial<SettingsDraft[K]>) => {
    setDraft((current) => ({ ...current, [key]: { ...current[key], ...patch } }) as SettingsDraft);
  };

  const apply = () => {
    if (errors.length) return false;
    if (!dirty) return true;
    const { sampleRate, ...audio } = draft.audio;
    const { width, height, fps, scaleFilter } = draft.video;
    const preferences: StudioPreferences = {
      general: structuredClone(draft.general),
      stream: structuredClone(draft.stream),
      output: structuredClone(draft.output),
      audio,
      video: { scaleFilter },
      hotkeys: structuredClone(draft.hotkeys),
      accessibility: structuredClone(draft.accessibility),
      advanced: structuredClone(draft.advanced),
    };
    commit((current) => {
      if (current.canvas.width !== width || current.canvas.height !== height) resizeProjectCanvas(current, width, height);
      current.canvas.fps = fps;
      current.audio.sampleRate = sampleRate;
      current.ui.preferences = preferences;
      return current;
    });
    setBaseline(structuredClone(draft));
    return true;
  };

  const requestClose = useCallback(() => {
    if (!dirty || window.confirm("Discard unsaved settings changes?")) onClose();
  }, [dirty, onClose]);

  const resetCurrent = () => {
    const defaults = defaultDraft();
    setDraft((current) => ({ ...current, [category]: structuredClone(defaults[category]) }));
  };

  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % categories.length;
    else if (event.key === "ArrowUp") next = (index - 1 + categories.length) % categories.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = categories.length - 1;
    else return;
    event.preventDefault();
    setCategory(categories[next].id);
    navigationRefs.current[next]?.focus();
  };

  return <Modal title="Settings" onClose={requestClose} width={960} className="sf-settings-modal" bodyClassName="sf-settings-modal-body">
    <div className="sf-settings-window">
      <div className="sf-settings-main">
        <nav className="sf-settings-nav" aria-label="Settings categories" role="tablist" aria-orientation="vertical">
          {categories.map((item, index) => <button ref={(element) => { navigationRefs.current[index] = element; }} type="button" role="tab" aria-selected={category === item.id} aria-controls="settings-panel" tabIndex={category === item.id ? 0 : -1} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)} onKeyDown={(event) => navigate(event, index)} key={item.id}><span>{item.label}</span>{dirtyCategories.has(item.id) && <i aria-label="Unsaved changes"/>}</button>)}
        </nav>
        <div className="sf-settings-content" id="settings-panel" role="tabpanel">
          <header><div><h3>{currentMeta.label}</h3><p>{currentMeta.description}</p></div>{dirtyCategories.has(category) && <span className="sf-unsaved"><i/>Unsaved</span>}</header>
          <div className="sf-settings-scroll">
            {categoryErrors.map((error) => <div className="sf-settings-error" role="alert" key={error.message}><CircleAlert/>{error.message}</div>)}

            {category === "general" && <>
              <SettingsSection title="Application">
                <SettingRow label="Language"><select value={draft.general.language} onChange={(event) => update("general", { language: event.target.value as "English" })}><option>English</option></select></SettingRow>
                <SettingRow label="Theme"><select value={draft.general.theme} onChange={(event) => update("general", { theme: event.target.value as "Dark" })}><option>Dark</option></select></SettingRow>
                <SettingRow label="UI scale" help="Applied after the next app reload."><select value={draft.general.uiScale} onChange={(event) => update("general", { uiScale: Number(event.target.value) as 90 | 100 | 110 })}><option value="90">90%</option><option value="100">100%</option><option value="110">110%</option></select></SettingRow>
              </SettingsSection>
              <SettingsSection title="Project behavior">
                <CheckRow checked={draft.general.autosave} onChange={(autosave) => update("general", { autosave })}>Autosave project changes</CheckRow>
                <CheckRow checked={draft.general.reopenPrevious} onChange={(reopenPrevious) => update("general", { reopenPrevious })}>Reopen the previous project at startup</CheckRow>
                <CheckRow checked={draft.general.confirmRemove} onChange={(confirmRemove) => update("general", { confirmRemove })}>Confirm before removing sources or scenes</CheckRow>
              </SettingsSection>
            </>}

            {category === "stream" && <>
              <div className="sf-settings-notice"><AlertTriangle/><div><strong>Streaming backend required</strong><p>OnMix never stores RTMP credentials in the browser. Connect an authenticated WebRTC gateway to enable live output.</p></div></div>
              <SettingsSection title="Gateway">
                <SettingRow label="Service"><select disabled><option>Custom WebRTC Gateway</option></select></SettingRow>
                <SettingRow label="Secure server URL" help="Example: https://ingest.example.com"><input value={draft.stream.serverUrl} placeholder="https://" onChange={(event) => update("stream", { serverUrl: event.target.value })}/></SettingRow>
                <SettingRow label="Authentication token"><input type="password" value={draft.stream.authToken} placeholder="Not configured" onChange={(event) => update("stream", { authToken: event.target.value })}/></SettingRow>
                <SettingRow label="Connection status"><output className="sf-settings-status offline">Backend unavailable</output></SettingRow>
              </SettingsSection>
            </>}

            {category === "output" && <>
              <SettingsSection title="Recording">
                <SettingRow label="Save location"><input value="Browser Downloads" readOnly/></SettingRow>
                <SettingRow label="Recording quality"><select value={draft.output.recordingQuality} onChange={(event) => update("output", { recordingQuality: event.target.value as StudioPreferences["output"]["recordingQuality"] })}><option value="balanced">Balanced</option><option value="high">High quality</option><option value="lossless">Lossless canvas</option></select></SettingRow>
                <SettingRow label="Filename pattern" help="Available tokens: {date}, {time}, and {project}."><input value={draft.output.fileNamePattern} onChange={(event) => update("output", { fileNamePattern: event.target.value })}/></SettingRow>
                <SettingRow label="Detected format"><input value={selectMimeType() ?? "Unsupported by this browser"} readOnly/></SettingRow>
                <CheckRow checked={draft.output.overwriteProtection} onChange={(overwriteProtection) => update("output", { overwriteProtection })}>Prevent accidental filename replacement</CheckRow>
              </SettingsSection>
              <SettingsSection title="Live output"><p className="sf-settings-muted">Live streaming controls remain disabled until a secure gateway is configured in Stream.</p><button disabled>Configure streaming output</button></SettingsSection>
            </>}

            {category === "audio" && <>
              <SettingsSection title="General audio">
                <SettingRow label="Sample rate"><select value={draft.audio.sampleRate} onChange={(event) => update("audio", { sampleRate: Number(event.target.value) as 44100 | 48000 })}><option value="48000">48 kHz</option><option value="44100">44.1 kHz</option></select></SettingRow>
                <SettingRow label="Channels"><select value={draft.audio.channelLayout} onChange={(event) => update("audio", { channelLayout: event.target.value as "Stereo" })}><option>Stereo</option></select></SettingRow>
                <SettingRow label="Meter decay"><select value={draft.audio.meterDecay} onChange={(event) => update("audio", { meterDecay: event.target.value as StudioPreferences["audio"]["meterDecay"] })}><option>Fast</option><option>Medium</option><option>Slow</option></select></SettingRow>
              </SettingsSection>
              <SettingsSection title="Monitoring">
                <SettingRow label="Monitoring device"><select value={draft.audio.monitoringDevice} onChange={(event) => update("audio", { monitoringDevice: event.target.value as "Default" })}><option>Default</option></select></SettingRow>
                <p className="sf-settings-muted">Source monitoring stays off by default to prevent feedback loops.</p>
              </SettingsSection>
            </>}

            {category === "video" && <>
              <SettingsSection title="Canvas and output">
                <SettingRow label="Base canvas"><select value={`${draft.video.width}x${draft.video.height}`} onChange={(event) => { const [width, height] = event.target.value.split("x").map(Number); update("video", { width, height }); }}>{CANVAS_PRESETS.map((preset) => <option value={`${preset.width}x${preset.height}`} key={`${preset.width}x${preset.height}`}>{preset.label}</option>)}</select></SettingRow>
                <SettingRow label="Target FPS"><select value={draft.video.fps} onChange={(event) => update("video", { fps: Number(event.target.value) as FrameRate })}>{FRAME_RATES.map((fps) => <option value={fps} key={fps}>{fps} FPS</option>)}</select></SettingRow>
                <SettingRow label="Scale filter" help="Used when media dimensions differ from the canvas."><select value={draft.video.scaleFilter} onChange={(event) => update("video", { scaleFilter: event.target.value as StudioPreferences["video"]["scaleFilter"] })}><option>Bilinear</option><option>Bicubic</option><option>Lanczos</option></select></SettingRow>
              </SettingsSection>
              {draft.video.width === 3840 && draft.video.fps === 120 && <div className="sf-settings-notice warning"><AlertTriangle/><div><strong>High performance mode</strong><p>4K at 120 FPS can exceed browser, encoder, and display capabilities. OnMix will request this target, but the browser may deliver fewer frames.</p></div></div>}
              <p className="sf-settings-muted">Applying a new canvas size scales the current scene layout proportionally. New visual sources fit the canvas automatically.</p>
            </>}

            {category === "hotkeys" && <SettingsSection title="Studio shortcuts"><div className="sf-hotkey-list">{hotkeyRows.map(([label, key]) => <SettingRow label={label} key={key}><input value={draft.hotkeys[key]} placeholder="Not assigned" onChange={(event) => update("hotkeys", { [key]: event.target.value })}/></SettingRow>)}</div><p className="sf-settings-muted">Clear a field to leave an action unassigned. Duplicate assignments must be resolved before applying.</p></SettingsSection>}

            {category === "accessibility" && <>
              <SettingsSection title="Visual experience">
                <CheckRow checked={draft.accessibility.reducedMotion} onChange={(reducedMotion) => update("accessibility", { reducedMotion })}>Reduce interface animation and motion</CheckRow>
                <CheckRow checked={draft.accessibility.highContrast} onChange={(highContrast) => update("accessibility", { highContrast })}>Increase interface contrast</CheckRow>
                <CheckRow checked={draft.accessibility.alwaysShowFocus} onChange={(alwaysShowFocus) => update("accessibility", { alwaysShowFocus })}>Always show keyboard focus indicators</CheckRow>
              </SettingsSection>
              <SettingsSection title="Announcements"><CheckRow checked={draft.accessibility.announceStatus} onChange={(announceStatus) => update("accessibility", { announceStatus })}>Announce recording and save status changes</CheckRow></SettingsSection>
            </>}

            {category === "advanced" && <>
              <SettingsSection title="Rendering">
                <SettingRow label="Renderer"><select value={draft.advanced.renderer} disabled><option>Canvas 2D</option></select></SettingRow>
                <SettingRow label="Color space"><select value={draft.advanced.colorSpace} onChange={(event) => update("advanced", { colorSpace: event.target.value as StudioPreferences["advanced"]["colorSpace"] })}><option>sRGB</option><option>Display P3</option></select></SettingRow>
                <CheckRow checked={draft.advanced.hardwareAcceleration} onChange={(hardwareAcceleration) => update("advanced", { hardwareAcceleration })}>Use browser hardware acceleration when available</CheckRow>
              </SettingsSection>
              <SettingsSection title="Local storage">
                <CheckRow checked={draft.advanced.persistProject} onChange={(persistProject) => update("advanced", { persistProject })}>Persist project configuration in IndexedDB</CheckRow>
                <CheckRow checked={draft.advanced.retainMediaMetadata} onChange={(retainMediaMetadata) => update("advanced", { retainMediaMetadata })}>Retain local media names and source metadata</CheckRow>
              </SettingsSection>
            </>}

            {category === "about" && <>
              <div className="sf-settings-about"><BrandMark className="sf-about-mark"/><div><h4>OnMix</h4><p>Version 1.0.0 · Local-first browser production workspace</p></div></div>
              <SettingsSection title="Runtime capabilities">{checkCompatibility().map((capability) => <div className="sf-capability" key={capability.name}><span>{capability.name}{!capability.required && " (enhancement)"}</span><b className={capability.supported ? "ok" : "bad"}>{capability.supported ? <><Check/>Available</> : "Unavailable"}</b></div>)}</SettingsSection>
              <SettingsSection title="Privacy"><p className="sf-settings-muted">Captured streams, project data, and recordings stay on this device. OnMix does not upload your media.</p></SettingsSection>
            </>}
          </div>
        </div>
      </div>
      <footer className="sf-settings-footer">
        <button type="button" onClick={resetCurrent} disabled={category === "about"}>Reset Defaults</button>
        <div>{errors.length > 0 && <span className="sf-validation-count"><CircleAlert/>{errors.length} issue{errors.length === 1 ? "" : "s"}</span>}<button type="button" onClick={onClose}>Cancel</button><button type="button" onClick={apply} disabled={!dirty || errors.length > 0}>Apply</button><button type="button" className="sf-primary" onClick={() => { if (apply()) onClose(); }} disabled={errors.length > 0}>OK</button></div>
      </footer>
    </div>
  </Modal>;
}
