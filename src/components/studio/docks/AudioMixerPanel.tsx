"use client";

import { ChevronDown, Settings, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { audioEngine } from "@/engine/media/AudioEngine";
import { useStudioStore } from "@/store/studioStore";
import { Panel } from "./Panel";

interface ChannelProps { id?: string; name: string }

function MixerChannel({ id, name }: ChannelProps) {
  const source = useStudioStore((s) => id ? s.project.sources[id] : undefined);
  const update = useStudioStore((s) => s.updateSource);
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!id) return;
    const timer = window.setInterval(() => setLevel(audioEngine.meter(id)), 80);
    return () => window.clearInterval(timer);
  }, [id]);
  const db = level > 0 ? Math.max(-60, 20 * Math.log10(level)) : -60;
  const meter = Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
  const volume = source?.volume ?? 1;
  const muted = source?.muted ?? false;
  const setVolume = (next: number) => {
    if (!id || !source) return;
    update(id, { volume: next });
    audioEngine.setVolume(id, muted ? 0 : next);
  };
  const toggleMute = () => {
    if (!id || !source) return;
    update(id, { muted: !muted });
    audioEngine.setVolume(id, muted ? volume : 0);
  };

  return <div className="sf-mixer-channel">
    <div className="sf-mixer-name"><span>{name}</span><ChevronDown size={10}/></div>
    <div className="sf-mixer-db">{level ? `${db.toFixed(1)} dB` : "-∞ dB"}</div>
    <div className="sf-channel-body">
      <input className="sf-vertical-fader" aria-label={`${name} volume`} type="range" min="0" max="1.5" step="0.01" value={volume} disabled={!source} onChange={(event) => setVolume(Number(event.target.value))}/>
      <div className="sf-vertical-meter" aria-label={`${name} level ${db.toFixed(1)} decibels`}>
        <div className="sf-meter-fill" style={{ height: `${meter}%` }}/>
        <i className="sf-peak-hold" style={{ bottom: `${meter}%` }}/>
      </div>
      <div className="sf-db-scale" aria-hidden="true"><span>0</span><span>-9</span><span>-20</span><span>-30</span><span>-40</span><span>-60</span></div>
    </div>
    <div className="sf-channel-actions"><button className={muted ? "muted" : ""} onClick={toggleMute} disabled={!source} aria-label={`Mute ${name}`}>{muted ? <VolumeX/> : <Volume2/>}</button><button aria-label={`${name} settings`} disabled={!source}><Settings/></button></div>
  </div>;
}

export function AudioMixerPanel() {
  const project = useStudioStore((s) => s.project);
  const sources = Object.values(project.sources).filter((source) => ["microphone", "audio", "video", "display", "webcam"].includes(source.type));
  const channels: ChannelProps[] = sources.length ? sources.map((source) => ({ id: source.id, name: source.name })) : [{ name: "Desktop Audio" }, { name: "Mic/Aux" }];
  return <Panel title="Audio Mixer" className="sf-mixer"><div className="sf-mixer-channels">{channels.map((channel) => <MixerChannel key={channel.id ?? channel.name} {...channel}/>)}</div><div className="sf-mixer-footer"><span>0 hidden</span><i/><button aria-label="Mixer layout"><span>▤</span></button><button aria-label="Mixer settings"><Settings/></button><button>Options <ChevronDown/></button></div></Panel>;
}
