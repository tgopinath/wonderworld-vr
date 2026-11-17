# Anatomy Lab

A browser-based 3D/VR atlas of the human body for students. Explore 2,827 named structures from open
anatomy data, layer by layer; cut cross-sections; build the body up organ by organ; watch the heart beat and
the lungs breathe; and test yourself with spaced repetition — on a laptop, tablet or Meta Quest (WebXR).

**Status: v0.2.0.** Not a medical device.

## Features
- **7 body systems**, loaded on demand: skeletal, muscular, joints & ligaments, cardiovascular, nervous,
  organs (visceral), lymphatic. Per-layer opacity; "only" to solo a layer.
- **Every part is reachable**: search by name, or browse the **Parts** list by system and body area.
- **Build your own body**: add organs and structures one by one ("Show only my parts"), or start from
  "Add major organs". Your build is saved.
- **Inspect any part**: click it → name, side, system, tissue group, extent in cm, a study note for ~50
  key structures, mirror twin, and neighbouring structures (computed from the model). Focus, isolate,
  hide, bookmark. The selection shows through see-through layers.
- **Choice of view**: Front, Back, Left, Right, Top, Bottom (patient's sides), around the whole body or the
  selected part; free orbit, pan and zoom.
- **Cross-sections**: axial, sagittal and coronal cuts with a slider and flip; the camera turns to face the cut.
- **Body in action**: heartbeat (atria then ventricles, 40–160 bpm, live phase + schematic ECG) and breathing
  (lungs expand, diaphragm descends, 6–30/min). Simplified motion of the real parts with textbook timing.
- **Study mode**: "Locate on model" and "Name the part" quizzes per system with Leitner spaced repetition;
  distractors are nearby structures. Progress is saved.
- **VR** (Meta Quest Browser): life-size body, ray + trigger to select, thumbstick-forward teleport, snap or
  smooth turn, a panel that follows you (isolate, hide, layers, heartbeat, breathing, study answers, Exit VR).

## What the model does not include
The open atlas is a single male body. It does not model skin, the larynx as one organ, ileum, caecum,
rectum and anus, female reproductive organs, or breasts. The app says so rather than inventing shapes.

## Quick start
Node 22+.
```bash
npm install
```
```bash
npm run dev
```
Open http://localhost:5193 → **Open the lab**. VR without a headset (dev only): http://localhost:5193/lab?xr=emulate

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (port 5193) |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run check` | typecheck + lint + unit tests |
| `npm run test:e2e` | Playwright tests (installed Google Chrome), incl. a WebXR emulator flow |
| `node tools/build-index.mjs` | Rebuild `src/data/structures.json` from the GLB files |

## Data & licence
Models: the seven system files from the open-source 3d-anatomy project, exported from Z-Anatomy, built on
BodyParts3D. Combined licence **CC BY-NC-SA 4.0** (non-commercial). Full attributions on the in-app
"Sources" page and in `public/models/License.txt`. App code: written for this project.

## Known limitations
- VR is verified in Meta's IWER Quest 3 emulator, not yet on a physical headset.
- Cardiovascular (~2.5 M triangles) and nervous (~1.4 M) layers are heavy on phones and standalone headsets.
- Cut surfaces are open (hollow), not capped. Body areas are assigned from each part's position (approximate).
- The parts browser and layer list are desktop/tablet panels; on phones, layers are toggled with chips.
- In VR, controller/hand models load from the jsDelivr CDN (XR library default).

Docs: [ARCHITECTURE.md](ARCHITECTURE.md) · [VR_INTERACTIONS.md](VR_INTERACTIONS.md) · [TESTING.md](TESTING.md) ·
[DEPLOYMENT.md](DEPLOYMENT.md) · [CHANGELOG.md](CHANGELOG.md) · [docs/adr/0001-xr-framework.md](docs/adr/0001-xr-framework.md)
