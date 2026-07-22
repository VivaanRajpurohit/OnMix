# Architecture

## Layers

- `src/components/studio`: React client shell, dock panels, dialogs, and direct-manipulation overlays.
- `src/store`: serializable project state and bounded snapshot history in Zustand.
- `src/engine/compositor`: requestAnimationFrame Canvas 2D rendering, independent of React rendering.
- `src/engine/media`: explicit browser device requests, runtime-only media registry, and Web Audio graph.
- `src/engine/recording`: MIME feature detection and `MediaRecorder` lifecycle.
- `src/engine/persistence`: versioned IndexedDB project repository and migrations.
- `src/engine/diagnostics`: browser capability reporting.

## Data flow

The persisted `StudioProject` contains only serializable configuration. `MediaRuntimeRegistry` maps source IDs to streams, media elements, and object URLs during the current session. `CanvasCompositor` reads the latest Zustand state through a getter every frame, so video frames never enter React state. The compositor canvas supplies a video track; `AudioEngine` supplies the mixed audio track; `RecorderEngine` records their combined `MediaStream`.

Undo/redo uses bounded project snapshots. Pointer movement is held in local interaction state and committed once at pointer-up, preventing history entries for every pixel.

## Future streaming boundary

The browser must never hold long-lived RTMP credentials. A future output interface should use:

```text
Canvas + Web Audio -> WebRTC ingest -> authenticated server -> FFmpeg/media server -> RTMP or SRT
```

WebCodecs and OffscreenCanvas are diagnostic enhancements behind feature detection; the baseline does not require them.

