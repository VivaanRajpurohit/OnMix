import { createId } from "@/lib/ids";
import { createSource } from "@/lib/sourceFactory";
import type { StudioProject, TextSource, ColorSource } from "@/types/studio";
import { CURRENT_PROJECT_VERSION } from "@/engine/persistence/migrations";

export function createDefaultProject(): StudioProject {
  const now = new Date().toISOString();
  const main = createId("scene"), camera = createId("scene"), screen = createId("scene");
  const background = createSource("color", main, 0) as ColorSource;
  Object.assign(background, { name: "Studio Background", color: "#15181d", locked: true, transform: { ...background.transform, x: 0, y: 0, width: 1920, height: 1080 } });
  const hint = createSource("text", main, 1) as TextSource;
  Object.assign(hint, { name: "Canvas Hint", text: "Add a source using the + button in Sources", fontSize: 25, fontWeight: 400, align: "center", color: "#818793", transform: { ...hint.transform, x: 600, y: 510, width: 720, height: 60 } });
  return {
    id: createId("project"), version: CURRENT_PROJECT_VERSION, name: "Untitled Project", createdAt: now, updatedAt: now,
    canvas: { width: 1920, height: 1080, fps: 30 },
    scenes: [{ id: main, name: "Main Scene", sourceIds: [background.id, hint.id] }, { id: camera, name: "Camera", sourceIds: [] }, { id: screen, name: "Screen Share", sourceIds: [] }],
    sources: { [background.id]: background, [hint.id]: hint }, selectedSceneId: main,
    transition: { type: "fade", duration: 300 }, audio: { sampleRate: 48000, masterVolume: 1 },
    ui: { showGrid: false, showSafeArea: false, snap: true, quickStartDismissed: true, dockWidths: [26, 22, 26, 11, 15], hiddenDocks: [] },
  };
}
