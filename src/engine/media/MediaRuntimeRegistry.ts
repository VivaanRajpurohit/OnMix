export type RuntimeMedia = { stream?: MediaStream; element?: HTMLImageElement | HTMLVideoElement | HTMLAudioElement; objectUrl?: string };

class MediaRuntimeRegistry {
  private entries = new Map<string, RuntimeMedia>();
  get(id: string) { return this.entries.get(id); }
  set(id: string, value: RuntimeMedia) { this.remove(id); this.entries.set(id, value); }
  remove(id: string) {
    const item = this.entries.get(id);
    item?.stream?.getTracks().forEach((track) => track.stop());
    if (item?.objectUrl) URL.revokeObjectURL(item.objectUrl);
    if (item?.element) { if (item.element instanceof HTMLMediaElement) item.element.pause(); if ("srcObject" in item.element) item.element.srcObject = null; }
    this.entries.delete(id);
  }
  clear() { [...this.entries.keys()].forEach((id) => this.remove(id)); }
}
export const mediaRegistry = new MediaRuntimeRegistry();
