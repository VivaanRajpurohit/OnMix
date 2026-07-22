import { recordingFilename } from "@/lib/filenames";
import type { RecordingResult } from "@/types/studio";
import { selectMimeType } from "./mimeTypes";

export class RecorderEngine {
  private recorder?: MediaRecorder; private chunks: Blob[] = []; private started = 0;
  start(stream: MediaStream) { const mimeType = selectMimeType(); if (!mimeType) throw new Error("This browser does not support WebM recording."); this.chunks = []; this.recorder = new MediaRecorder(stream, { mimeType }); this.recorder.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); }; this.started = Date.now(); this.recorder.start(1000); return mimeType; }
  pause() { if (this.recorder?.state === "recording") this.recorder.pause(); }
  resume() { if (this.recorder?.state === "paused") this.recorder.resume(); }
  stop() { return new Promise<RecordingResult>((resolve, reject) => { if (!this.recorder) return reject(new Error("No recording is active.")); const recorder = this.recorder; recorder.onerror = () => reject(new Error("Recording failed.")); recorder.onstop = () => { const duration = Date.now() - this.started, blob = new Blob(this.chunks, { type: recorder.mimeType }); resolve({ blob, duration, mimeType: recorder.mimeType, filename: recordingFilename() }); }; recorder.stop(); }); }
  state() { return this.recorder?.state ?? "inactive"; }
}
export const recorderEngine = new RecorderEngine();

