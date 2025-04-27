# KBD to MIDI Piano

A modernized Chrome extension that turns your keyboard into a MIDI piano, with real-time audio playback, MIDI input, velocity control, and export options.

Fully rebuilt with modular, readable JavaScript. Focused on performance and usability—no chords, no legacy clutter.

---

## Features

- 🎹 Play notes using your keyboard
- 🎧 Real-time audio via Howler.js
- 🎛️ Velocity control with live updates
- ⬆️ Web MIDI input support
- 🎤 Record WebAudio output to `.wav`
- 🎼 Export sessions to `.mid`
- 🧰 Built-in velocity and sustain tools

---

## Structure

- `popup.html` — UI and layout
- `popup.js` — Fully modularized logic
- `manifest.json` — Extension metadata
- `audio/` — Preloaded piano samples
- `lib/` — WebAudioRecorder, MIDI export

---

## Status

Actively maintained and working as intended. Uses modern vanilla JavaScript—no bundlers, no frameworks. Clean and modular codebase.

---

## License

MIT License  
See the [LICENSE](./LICENSE) file for details.
