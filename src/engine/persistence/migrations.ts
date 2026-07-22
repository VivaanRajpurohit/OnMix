import type { StudioProject, TextSource } from "@/types/studio";

export const CURRENT_PROJECT_VERSION = 2;

export function migrateProject(input: unknown): unknown {
  const data = structuredClone(input) as Partial<StudioProject>;
  const sourceVersion = data.version ?? 1;

  if (sourceVersion < 2) {
    const sources = data.sources ?? {};
    const welcomeIds = Object.values(sources)
      .filter((source) => source.type === "text" && source.name === "Welcome Title" && source.text === "StreamForge Studio")
      .map((source) => source.id);

    for (const sourceId of welcomeIds) delete sources[sourceId];
    data.scenes = data.scenes?.map((scene) => ({
      ...scene,
      sourceIds: scene.sourceIds.filter((sourceId) => !welcomeIds.includes(sourceId)),
    }));

    const oldHint = Object.values(sources).find(
      (source): source is TextSource => source.type === "text" && source.name === "Quick Start Text" && source.text === "Add a source to begin",
    );
    if (oldHint) {
      Object.assign(oldHint, {
        name: "Canvas Hint",
        text: "Add a source using the + button in Sources",
        fontSize: 25,
        fontWeight: 400,
        align: "center",
        color: "#818793",
        transform: { ...oldHint.transform, x: 600, y: 510, width: 720, height: 60 },
      });
    }

    data.sources = sources;
    data.ui = {
      showGrid: data.ui?.showGrid ?? false,
      showSafeArea: data.ui?.showSafeArea ?? false,
      snap: data.ui?.snap ?? true,
      quickStartDismissed: true,
      dockWidths: data.ui?.dockWidths ?? [26, 22, 26, 11, 15],
      hiddenDocks: data.ui?.hiddenDocks ?? [],
    };
  }

  data.version = CURRENT_PROJECT_VERSION;
  return data;
}
