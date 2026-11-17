# Changelog

## 0.1.0 — 2026-11-17 — First playable MVP (Phases 1–3)
### Added
- Architecture docs, PRD, XR decision record (React Three XR v6 over Meta IWSDK), roadmap.
- Pure TypeScript learning engine: round generation + validation for Counting, Find the Number, Adding Up,
  Taking Away; two-level hints; adaptive difficulty (5 levels each); rewards (stars, coins, 10 badges, daily goal,
  streaks, Maths medal); interaction state machine; drop-zone geometry.
- Local persistence (versioned localStorage repository), parent PIN (salted SHA-256), Zustand stores.
- 3D classroom hub (instanced bookshelves, desks, display board, portals, Pip guide), Mathematics World playground,
  question board, procedural items and number blocks, 3D reward burst, spatial UI primitives.
- Unified `Grabbable`/`DropZone` interaction for mouse, touch, XR ray, XR grip and hands; tap-to-place alternative.
- Desktop rig (WASD/QE, drag-look, click-to-walk), XR rig (snap/smooth turn around the head, thumbstick-gated
  teleport, comfort vignette, seated/standing), haptics, spatial sound effects, narration + captions, optional music.
- Pages: welcome (animated 3D background, device indicator, audio), profiles, worlds, play HUD, parent dashboard,
  settings (sound + VR comfort), privacy.
- Tests: 46 unit tests; 6 Playwright tests including real-drag rounds and a WebXR emulator flow.
- Dev-only `?xr=emulate` IWER Quest 3 emulator; production builds strip all emulator code.

### Fixed during development
- Clicks after a drag fell through to the floor (walk-away): pointer capture is now released explicitly and floor
  walking requires the floor to be the first hit.
- Teleport arc stole the trigger from UI in VR: arc now shows only while the stick is pushed forward.
- Slow trigger presses weren't clicks: XR click threshold raised to 700 ms for children.
