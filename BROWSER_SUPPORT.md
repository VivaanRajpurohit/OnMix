# Browser support

Chrome and Edge desktop are the primary targets. Firefox and Safari receive best-effort support.

| Capability | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| Webcam / microphone | Supported | Supported | Supported |
| Display capture | Supported; picker required | Supported; differences apply | Limited differences apply |
| Canvas capture stream | Supported | Supported | Version-dependent |
| WebM MediaRecorder | Supported | Supported | Version/codec-dependent |
| Web Audio mixing | Supported | Supported | Supported |
| IndexedDB | Supported | Supported | Supported |
| WebCodecs | Enhancement | Varies | Varies |

The application checks APIs at runtime and reports unsupported functionality without preventing basic project editing. Capture cancellation and permission denial are normal browser states, not application failures.

System audio is never guaranteed. It depends on browser, platform, capture surface, and whether the user enables audio in the browser picker.

