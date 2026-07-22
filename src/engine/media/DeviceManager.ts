export class DeviceManager {
  private listener?: () => void;
  async enumerate() {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    return navigator.mediaDevices.enumerateDevices();
  }
  watch(callback: () => void) { this.listener = callback; navigator.mediaDevices?.addEventListener("devicechange", callback); }
  dispose() { if (this.listener) navigator.mediaDevices?.removeEventListener("devicechange", this.listener); }
  async display(includeAudio = false) { return navigator.mediaDevices.getDisplayMedia({ video: true, audio: includeAudio }); }
  async webcam(deviceId?: string) { return navigator.mediaDevices.getUserMedia({ video: deviceId ? { deviceId: { exact: deviceId } } : true, audio: false }); }
  async microphone(deviceId?: string) { return navigator.mediaDevices.getUserMedia({ video: false, audio: deviceId ? { deviceId: { exact: deviceId } } : true }); }
}
export const deviceManager = new DeviceManager();

