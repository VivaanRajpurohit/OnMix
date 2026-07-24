"use client";

import { create } from "zustand";
import { createDefaultProject } from "./defaultProject";
import { createId } from "@/lib/ids";
import { createSource } from "@/lib/sourceFactory";
import type { SaveState, SourceType, StudioProject, StudioSource, Transform } from "@/types/studio";

type Snapshot = StudioProject;
interface StudioState {
  project: StudioProject;
  selectedSourceIds: string[];
  previewSceneId: string;
  programSceneId: string;
  studioMode: boolean;
  saveState: SaveState;
  history: Snapshot[];
  future: Snapshot[];
  clipboard?: StudioSource;
  recording: { state: "idle" | "recording" | "paused"; elapsed: number };
  setProject(project: StudioProject): void;
  setSaveState(state: SaveState): void;
  commit(mutator: (project: StudioProject) => StudioProject): void;
  addScene(): void;
  removeScene(id: string): void;
  renameScene(id: string, name: string): void;
  selectScene(id: string): void;
  reorderScene(id: string, delta: number): void;
  addSource(type: SourceType): string;
  removeSelectedSources(): void;
  duplicateSelected(): void;
  selectSource(id?: string, additive?: boolean): void;
  updateSource(id: string, patch: Partial<StudioSource>): void;
  updateTransform(id: string, patch: Partial<Transform>): void;
  reorderSource(id: string, delta: number): void;
  copy(): void;
  paste(): void;
  undo(): void;
  redo(): void;
  setStudioMode(value: boolean): void;
  transitionToPreview(): void;
  setRecording(state: StudioState["recording"]): void;
  newProject(): void;
}

const clone = (project: StudioProject): StudioProject => structuredClone(project);
const updated = (project: StudioProject) => ({ ...project, updatedAt: new Date().toISOString() });

export const useStudioStore = create<StudioState>((set, get) => ({
  project: createDefaultProject(), selectedSourceIds: [], previewSceneId: "", programSceneId: "", studioMode: false, saveState: "saved", history: [], future: [], recording: { state: "idle", elapsed: 0 },
  setProject: (project) => set({ project, previewSceneId: project.selectedSceneId, programSceneId: project.selectedSceneId, selectedSourceIds: [], history: [], future: [], saveState: "saved" }),
  setSaveState: (saveState) => set({ saveState }),
  commit: (mutator) => set((s) => {
    const project = updated(mutator(clone(s.project)));
    return { project, history: [...s.history.slice(-49), clone(s.project)], future: [], saveState: project.ui.preferences?.general.autosave === false ? "unsaved" : "saving" };
  }),
  addScene: () => get().commit((p) => { const id = createId("scene"); p.scenes.push({ id, name: `Scene ${p.scenes.length + 1}`, sourceIds: [] }); p.selectedSceneId = id; return p; }),
  removeScene: (id) => { if (get().project.scenes.length <= 1) return; if (typeof window !== "undefined" && get().project.ui.preferences?.general.confirmRemove && !window.confirm("Remove this scene and its sources?")) return; get().commit((p) => { const scene = p.scenes.find((s) => s.id === id); scene?.sourceIds.forEach((sourceId) => delete p.sources[sourceId]); p.scenes = p.scenes.filter((s) => s.id !== id); if (p.selectedSceneId === id) p.selectedSceneId = p.scenes[0].id; return p; }); },
  renameScene: (id, name) => get().commit((p) => { const scene = p.scenes.find((s) => s.id === id); if (scene) scene.name = name; return p; }),
  selectScene: (id) => set((s) => ({ project: { ...s.project, selectedSceneId: id }, previewSceneId: id, programSceneId: s.studioMode ? s.programSceneId : id, selectedSourceIds: [] })),
  reorderScene: (id, delta) => get().commit((p) => { const index = p.scenes.findIndex((s) => s.id === id), target = Math.max(0, Math.min(p.scenes.length - 1, index + delta)); if (index >= 0 && index !== target) [p.scenes[index], p.scenes[target]] = [p.scenes[target], p.scenes[index]]; return p; }),
  addSource: (type) => { const { project } = get(); const scene = project.scenes.find((s) => s.id === project.selectedSceneId)!; const source = createSource(type, scene.id, scene.sourceIds.length); get().commit((p) => { p.sources[source.id] = source; p.scenes.find((s) => s.id === scene.id)!.sourceIds.push(source.id); return p; }); set({ selectedSourceIds: [source.id] }); return source.id; },
  removeSelectedSources: () => { const ids = get().selectedSourceIds; if (!ids.length) return; if (typeof window !== "undefined" && get().project.ui.preferences?.general.confirmRemove && !window.confirm(`Remove ${ids.length === 1 ? "this source" : `${ids.length} sources`}?`)) return; get().commit((p) => { p.scenes.forEach((s) => { s.sourceIds = s.sourceIds.filter((id) => !ids.includes(id)); }); ids.forEach((id) => delete p.sources[id]); return p; }); set({ selectedSourceIds: [] }); },
  duplicateSelected: () => { const source = get().project.sources[get().selectedSourceIds[0]]; if (!source) return; get().commit((p) => { const id = createId("source"); const copy = { ...structuredClone(source), id, name: `${source.name} Copy`, transform: { ...source.transform, x: source.transform.x + 24, y: source.transform.y + 24 } }; p.sources[id] = copy; p.scenes.find((s) => s.id === source.sceneId)?.sourceIds.push(id); set({ selectedSourceIds: [id] }); return p; }); },
  selectSource: (id, additive) => set((s) => ({ selectedSourceIds: !id ? [] : additive ? (s.selectedSourceIds.includes(id) ? s.selectedSourceIds.filter((x) => x !== id) : [...s.selectedSourceIds, id]) : [id] })),
  updateSource: (id, patch) => get().commit((p) => { if (p.sources[id]) p.sources[id] = { ...p.sources[id], ...patch } as StudioSource; return p; }),
  updateTransform: (id, patch) => get().commit((p) => { if (p.sources[id]) p.sources[id].transform = { ...p.sources[id].transform, ...patch }; return p; }),
  reorderSource: (id, delta) => get().commit((p) => { const scene = p.scenes.find((s) => s.sourceIds.includes(id)); if (!scene) return p; const index = scene.sourceIds.indexOf(id), target = Math.max(0, Math.min(scene.sourceIds.length - 1, index + delta)); [scene.sourceIds[index], scene.sourceIds[target]] = [scene.sourceIds[target], scene.sourceIds[index]]; scene.sourceIds.forEach((sourceId, zIndex) => p.sources[sourceId].zIndex = zIndex); return p; }),
  copy: () => { const source = get().project.sources[get().selectedSourceIds[0]]; if (source) set({ clipboard: clone({ ...get().project, sources: { [source.id]: source } }).sources[source.id] }); },
  paste: () => { const c = get().clipboard; if (!c) return; const id = createId("source"), sceneId = get().project.selectedSceneId; get().commit((p) => { const source = { ...structuredClone(c), id, sceneId, name: `${c.name} Copy`, transform: { ...c.transform, x: c.transform.x + 20, y: c.transform.y + 20 } }; p.sources[id] = source; p.scenes.find((s) => s.id === sceneId)!.sourceIds.push(id); return p; }); set({ selectedSourceIds: [id] }); },
  undo: () => set((s) => s.history.length ? ({ project: s.history.at(-1)!, history: s.history.slice(0, -1), future: [clone(s.project), ...s.future], saveState: "saving" }) : s),
  redo: () => set((s) => s.future.length ? ({ project: s.future[0], history: [...s.history, clone(s.project)], future: s.future.slice(1), saveState: "saving" }) : s),
  setStudioMode: (studioMode) => set((s) => ({ studioMode, previewSceneId: s.project.selectedSceneId, programSceneId: studioMode ? s.programSceneId || s.project.selectedSceneId : s.project.selectedSceneId })),
  transitionToPreview: () => set((s) => ({ programSceneId: s.previewSceneId })),
  setRecording: (recording) => set({ recording }),
  newProject: () => get().setProject(createDefaultProject()),
}));
