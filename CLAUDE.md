# CLAUDE.md — working on WonderWorld VR

Educational WebXR app for children (React 19 + R3F 9 + @react-three/xr 6 + Zustand + Tailwind 4, Vite 8, TS 6 strict).
Read ARCHITECTURE.md first; the XR choice is in docs/adr/0001-xr-framework.md.

## Rules that matter here
- **The engine decides, the scene reports.** `src/engine/**` is pure TS (no React/three/DOM). 3D components only
  call `useSessionStore().place(itemId, zoneId)` / `check()` and render what comes back. Never put answer logic
  or success animations in scene components.
- **Activity content is data** in `src/config/activities.ts` (ranges, choices, kinds, hints). Add levels there.
- **Every interactive object** goes through `Grabbable` (+ `DropZone`) so mouse, touch, XR ray, XR grip and hands
  share one code path and the state machine in `engine/interaction/machine.ts`.
- **3D text font is Latin-only** (`public/fonts`). Don't put emoji, ₹, − or × in drei `<Text>` — they'd trigger a
  runtime font CDN fetch. Use ASCII in 3D; emoji are fine in HTML.
- **Comfort**: never move the XR camera on a timer or smoothly; only discrete jumps on a user action.
- **No fake features.** Unbuilt worlds stay "Coming soon" and inert. Document limitations in README.
- **Privacy**: no analytics/ads SDKs, no extra personal data, child data never leaves the device in demo mode.
  The only third-party request is the XR library loading controller/hand models from jsDelivr (no user data).
- Prefer instanced meshes and shared geometries/materials (Quest budget). Don't set React state inside `useFrame`.

## Commands
`npm run dev` (5193) · `npm run check` · `npm run test:e2e` (Playwright, installed Chrome, port 5194) · `npm run build`.
Dev-only VR emulator: `/play?xr=emulate` (`&xrui=off` hides the emulator panel for scripted tests).

## Testing hooks
`window.__ww` (dev builds or `?e2e`) is a read-only bridge: object/zone screen + world positions, current round,
camera, XR input poses, rendered frame count. E2E tests use it to aim **real** mouse drags and emulated controllers.
Keep it read-only (exception: `exitVR`, same as the in-scene button).

## Where things live
engine/ (learning, difficulty, rewards, interaction) · state/ (appStore persistent, sessionStore per-play,
playerStore pose) · persistence/ (Repository, LocalRepository, PIN) · three/ (PlayCanvas, scenes, components, rig, xr)
· ui/ (pages, components) · audio/ · config/.
