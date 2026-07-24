import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultProject } from "@/store/defaultProject";
import { useStudioStore } from "@/store/studioStore";
import { createSource } from "@/lib/sourceFactory";
import { clampCrop, snapPosition, visibleRect } from "@/lib/geometry";
import { projectSchema } from "@/lib/validation";
import { recordingFilename } from "@/lib/filenames";
import { selectMimeType } from "@/engine/recording/mimeTypes";
import { migrateProject } from "@/engine/persistence/migrations";
import { fitToCanvas } from "@/lib/videoPresets";

describe("project and source model", () => {
  beforeEach(() => useStudioStore.getState().setProject(createDefaultProject()));
  it("creates a schema-valid default project", () => expect(projectSchema.safeParse(createDefaultProject()).success).toBe(true));
  it("rejects an invalid imported project", () => expect(projectSchema.safeParse({ name:"bad" }).success).toBe(false));
  it("creates typed text sources with safe defaults", () => { const source=createSource("text","scene",0); expect(source.type).toBe("text"); if(source.type==="text") expect(source.text).toBe("New text"); expect(source.transform.width).toBeGreaterThan(0); });
  it("adds and removes sources", () => { const store=useStudioStore.getState(), before=Object.keys(store.project.sources).length, id=store.addSource("color"); expect(useStudioStore.getState().project.sources[id]).toBeTruthy(); useStudioStore.getState().removeSelectedSources(); expect(Object.keys(useStudioStore.getState().project.sources)).toHaveLength(before); });
  it("reorders scenes", () => { const first=useStudioStore.getState().project.scenes[0].id; useStudioStore.getState().reorderScene(first,1); expect(useStudioStore.getState().project.scenes[1].id).toBe(first); });
  it("reorders sources consistently", () => { const store=useStudioStore.getState(), scene=store.project.scenes[0], id=scene.sourceIds[0]; store.reorderSource(id,1); expect(useStudioStore.getState().project.scenes[0].sourceIds[1]).toBe(id); });
  it("undoes and redoes a source creation", () => { const before=Object.keys(useStudioStore.getState().project.sources).length; useStudioStore.getState().addSource("text"); useStudioStore.getState().undo(); expect(Object.keys(useStudioStore.getState().project.sources)).toHaveLength(before); useStudioStore.getState().redo(); expect(Object.keys(useStudioStore.getState().project.sources)).toHaveLength(before+1); });
});

describe("geometry", () => {
  it("clamps crop values", () => { expect(clampCrop(-1,100)).toBe(0); expect(clampCrop(200,100)).toBe(99); });
  it("calculates a visible cropped rectangle", () => expect(visibleRect({x:1,y:2,width:100,height:80,scaleX:1,scaleY:1,rotation:0,cropTop:5,cropRight:10,cropBottom:5,cropLeft:10})).toEqual({x:1,y:2,width:80,height:70}));
  it("snaps sources to canvas edges and center", () => { expect(snapPosition(6,7,100,100,1920,1080)).toMatchObject({x:0,y:0}); expect(snapPosition(912,493,100,100,1920,1080)).toEqual({x:910,y:490}); });
  it("fits widescreen media inside a 4K canvas", () => expect(fitToCanvas(1920,1080,3840,2160)).toEqual({x:0,y:0,width:3840,height:2160}));
  it("centers portrait media without stretching", () => expect(fitToCanvas(1080,1920,1920,1080)).toEqual({x:656,y:0,width:608,height:1080}));
});

describe("recording and persistence helpers", () => {
  it("selects the first supported recording MIME type", () => { const mock={isTypeSupported:vi.fn((type:string)=>type.includes("vp8"))} as unknown as typeof MediaRecorder; expect(selectMimeType(mock)).toBe("video/webm;codecs=vp8,opus"); });
  it("returns null without MediaRecorder support", () => expect(selectMimeType(undefined)).toBeNull());
  it("generates deterministic safe filenames", () => expect(recordingFilename(new Date(2026,6,22,14,30,5))).toBe("OnMix_2026-07-22_14-30-05.webm"));
  it("migrates unversioned project data", () => expect((migrateProject({name:"old"}) as {version:number}).version).toBe(2));
});
