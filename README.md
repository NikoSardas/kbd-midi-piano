# KBD to MIDI Piano

A cleaned-up Chrome extension that turns your keyboard into a MIDI piano, with audio playback, recording, velocity control, and MIDI export.

Originally a legacy personal tool, this project has been fully modernized with modular JavaScript, structured handlers, and better event flow. All chord and bloat features removed—this version focuses on core usability.

---

## Features

- 🎹 Play notes using your keyboard
- 🎧 Real-time audio playback using Howler.js
- 🔊 Velocity control (adjust or randomize)
- ⬆️ MIDI input support
- 🎤 Record mic or Howler stream to `.wav`
- 🎼 Export recorded session to `.mid`
- 📁 Load your own `.mp3`/`.wav` files

---

## Structure

- `popup.html` — Main UI layout
- `popup.js` — Core logic, fully modularized
- `manifest.json` — Extension config
- `audio/` — Preloaded piano notes
- `lib/` — WebAudioRecorder, MIDI export libraries, etc.

---

## Status

This is a working rebuild of the original extension—functionally stable and cleaned up for maintainability. No frameworks or bundlers yet, just modern vanilla JavaScript.

---

## Roadmap

- [ ] Break into ES modules
- [ ] Use Vite for build/dev
- [ ] Polish UI (optional)

---

## License

MIT License.  
See the [LICENSE](./LICENSE) file for details.
