# Architecture

XR framework decision: [docs/adr/0001-xr-framework.md](docs/adr/0001-xr-framework.md) (React Three XR v6, not IWSDK).

```
ui/ (React DOM, Tailwind)          three/ (R3F + XR)
        \                            /
         state/ (Zustand: labStore persisted, viewStore transient, playerStore)
                        |
         engine/ (pure TS: anatomy, quiz, physiology, notes) — unit-tested
                        |
         data/structures.json (generated from the GLBs by tools/build-index.mjs)
```

## Data pipeline
`public/models/*.glb` (Draco) → `tools/build-index.mjs` reads each GLB's JSON chunk (no decoding) and writes
one entry per named mesh node: id (`system:original name`), base name, side, system, material, world-space
bounding box. The index loads lazily with the lab (~85 kB gzipped). At runtime `Body.tsx` keys meshes by the
same original name (`userData.za_name`), so index and meshes always agree.

## Modules
| Concern | Where |
|---|---|
| Structure data, names, search, neighbours, body areas | `src/engine/anatomy.ts` |
| Study notes (~50) | `src/engine/notes.ts` (test asserts every key exists in the model) |
| Quizzes + Leitner spaced repetition | `src/engine/quiz.ts` |
| Heartbeat / breathing timing | `src/engine/physiology.ts` |
| Layer loading, materials, BVH picking | `src/three/body/Body.tsx`, `materials.ts` |
| Visibility / highlight (imperative, no re-render of 2,800 meshes) | `src/three/body/registry.ts` |
| Cross-section | `src/three/body/CrossSection.tsx` (one shared clipping plane) |
| Animations on real meshes | `src/three/body/Animator.tsx` (scale/translate about pivots) |
| Camera (orbit, focus, standard views, cut-facing) | `src/three/LabCanvas.tsx` |
| VR rig + panel | `src/three/rig/XRRig.tsx`, `src/three/VrPanel.tsx`, `src/three/xr.ts` |
| Pages | `src/ui/LandingPage.tsx`, `LabPage.tsx`, `LabPanels.tsx`, `AboutPage.tsx` |
| Test bridge (`window.__al`, dev / `?e2e`) | `src/three/debug.ts` |

## Picking
One handler on the body group for mouse, touch and XR rays. It walks the hits and skips invisible meshes,
see-through layers (opacity < 0.35) and anything cut away by the cross-section. R3F events give every hit in
`intersections`; XR pointer events give theirs in `intersection` (and throw on `delta`, which is guarded).
three-mesh-bvh trees are built in idle time after each layer loads.

## Rendering budget
Layers load only when switched on. One shared material per (system, tissue) so opacity and clipping are one
change per layer. The contact shadow renders once and refreshes only when layers change. Production builds strip
the WebXR emulator.

## Persistence
`localStorage` key `anatomylab:v1`: layer visibility/opacity, study cards (Leitner boxes), answer counts,
bookmarks, built parts, VR comfort. Saved 200 ms after a change and immediately on page hide/close.
