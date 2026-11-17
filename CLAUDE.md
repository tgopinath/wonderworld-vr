# CLAUDE.md — Anatomy Lab

3D/VR human-anatomy atlas: React 19 + R3F 9 + @react-three/xr 6 + Zustand + Tailwind 4, Vite 8, TS 6 strict.
Read ARCHITECTURE.md first.

## Rules
- **Never invent anatomy.** Geometry comes only from `public/models/*.glb`; names come from the model.
  Study notes (`src/engine/notes.ts`) are short textbook facts and must match real `base` names (a test checks).
- Regenerate `src/data/structures.json` with `node tools/build-index.mjs` if models change.
- Keep the licence: models are CC BY-NC-SA 4.0 — non-commercial, attribution on the Sources page and
  `public/models/License.txt` must stay.
- Visibility/highlight are imperative (`three/body/registry.ts`); don't re-render meshes through React.
- XR pointer events: hit is in `e.intersection`; reading `e.delta` throws — use the guarded helpers.
- 3D text font is Latin-only (`public/fonts`): no emoji or special symbols in drei `<Text>`.
- Comfort: never move the XR camera on a timer; only discrete jumps on a user action.
- Heavy layers (cardiovascular, nervous): keep them opt-in.

## Commands
`npm run dev` (5193) · `npm run check` · `npm run test:e2e` · `npm run build` · dev VR emulator: `/lab?xr=emulate`.
