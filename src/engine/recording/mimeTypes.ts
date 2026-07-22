export const RECORDING_MIME_TYPES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
export function selectMimeType(MediaRecorderClass: typeof MediaRecorder | undefined = globalThis.MediaRecorder) { if (!MediaRecorderClass) return null; return RECORDING_MIME_TYPES.find((type) => MediaRecorderClass.isTypeSupported(type)) ?? null; }

