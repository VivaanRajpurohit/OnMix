import { mediaRegistry } from "./MediaRuntimeRegistry";

export class AudioEngine {
  context?: AudioContext;
  destination?: MediaStreamAudioDestinationNode;
  master?: GainNode;
  private sources = new Map<string, { gain: GainNode; analyser: AnalyserNode }>();
  init(sampleRate = 48000) {
    if (this.context) return;
    this.context = new AudioContext({ sampleRate });
    this.master = this.context.createGain();
    this.destination = this.context.createMediaStreamDestination();
    this.master.connect(this.destination);
  }
  attach(id: string, volume = 1) {
    const stream = mediaRegistry.get(id)?.stream;
    if (!stream?.getAudioTracks().length) return;
    this.init();
    const input = this.context!.createMediaStreamSource(stream), gain = this.context!.createGain(), analyser = this.context!.createAnalyser();
    analyser.fftSize = 256; gain.gain.value = volume; input.connect(gain).connect(analyser).connect(this.master!); this.sources.set(id, { gain, analyser });
  }
  setVolume(id: string, value: number) { this.sources.get(id)?.gain.gain.setTargetAtTime(value, this.context?.currentTime ?? 0, 0.01); }
  meter(id: string) { const analyser = this.sources.get(id)?.analyser; if (!analyser) return 0; const data = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(data); let sum = 0; data.forEach((v) => sum += ((v - 128) / 128) ** 2); return Math.sqrt(sum / data.length); }
  stream() { this.init(); return this.destination!.stream; }
  dispose() { this.sources.clear(); void this.context?.close(); this.context = undefined; }
}
export const audioEngine = new AudioEngine();

