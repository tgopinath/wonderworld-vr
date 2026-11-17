# WonderWorld VR

An educational 3D/VR learning app for children aged 5–12. Children learn maths by **grabbing, counting and
moving real 3D objects** — in a desktop browser, on a phone or tablet, or inside a Meta Quest headset (WebXR).

**Live:** https://wonderworld-vr.vercel.app (HTTPS, so Enter VR works in Meta Quest Browser)

**Status: v0.1.0 — first playable MVP** (Phases 1–3 of the roadmap). See [docs/ROADMAP.md](docs/ROADMAP.md).

## What works today
- Welcome screen with an animated 3D backdrop, device indicator and audio toggles.
- Child profiles (nickname, age group, avatar only), several per device.
- 3D classroom hub: furniture, instanced bookshelves, display board, Pip the guide robot, six world portals
  (Maths is playable; the other five are clearly marked **Coming soon** and do nothing when tapped).
- **Mathematics World** with four activities, all validated by the learning engine from the objects actually placed:
  Counting · Find the Number · Adding Up · Taking Away.
- Gentle hints after mistakes (level 1 then level 2), adaptive difficulty (5 levels per activity), effort-based stars,
  coins, 10 badges, a daily goal, day streaks, a Maths medal and a 3D reward burst.
- Desktop: WASD/arrows walk, Q/E turn, drag empty space to look, click the floor to walk, drag objects (or tap an
  object, then tap a basket). Touch works the same way.
- VR: Enter/Exit VR, ray + trigger select, grip grab/carry/release, push-stick-forward teleport, snap or smooth
  turning, comfort vignette, seated/standing modes, haptics.
- Parent corner behind a grown-up question + PIN: real saved progress, accuracy, tricky activities, recent rounds,
  fixed-level overrides, session limits, break reminders, profile edit/delete, delete-all-data.
- Local progress persistence (demo mode; no account; child data never leaves the device).

## Quick start
Requires Node 22+ (tested on Node 24.20, npm 11.19).
```bash
npm install
```
```bash
npm run dev
```
Open http://localhost:5193.

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 5193 (WebXR emulator available) |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` / `npm run lint` | TypeScript strict check / ESLint |
| `npm test` | Vitest unit tests (engine, persistence, stores) |
| `npm run test:e2e` | Playwright browser tests incl. WebXR emulator (uses installed Google Chrome) |
| `npm run check` | typecheck + lint + unit tests |

### Trying VR without a headset
In dev, open **http://localhost:5193/play?xr=emulate** — this force-installs Meta's IWER emulator (Quest 3) with
an on-screen panel to move the head and controllers. Press **Enter VR (emulator)**.

### On a Meta Quest
WebXR needs HTTPS (or localhost). See [DEPLOYMENT.md](DEPLOYMENT.md) for serving over HTTPS on your LAN and for
static hosting.

## Supported devices
| Device | Status |
|---|---|
| Desktop Chrome / Edge / Firefox / Safari | Tested in Chrome (manual + automated) |
| Mobile browsers (touch) | Implemented (tap-to-walk, drag-to-look, tap-select-place). Not yet tested on physical phones |
| Meta Quest 2 / 3 / Pro — Meta Quest Browser | Implemented and verified in the IWER Quest 3 emulator. **Not yet tested on a physical headset** |

## Known limitations (honest list)
- No backend yet: PostgreSQL, parent accounts and server auth are Phase 5 (needs your approval for hosting).
  The parent PIN is a **local** gate (salted SHA-256 in localStorage), not account security.
- Geography, Space, Science, Money and Puzzle worlds, multiplication and number puzzles are not built yet.
- Hand tracking uses the XR library's default hand pointers (pinch to select/grab); it is not tuned or tested.
- Narration uses the browser's speech synthesis — voice quality varies by device; captions are always shown.
- Performance budgets are set (see TESTING.md) but have not been profiled on Quest hardware.
- A wrong answer in a round the child abandons is not stored (rounds are recorded when completed).
- In VR, controller/hand 3D models load from the jsDelivr CDN (library default). Self-hosting them is planned.

## Documentation
[ARCHITECTURE.md](ARCHITECTURE.md) · [docs/PRD.md](docs/PRD.md) · [docs/adr/0001-xr-framework.md](docs/adr/0001-xr-framework.md) ·
[VR_INTERACTIONS.md](VR_INTERACTIONS.md) · [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) · [TESTING.md](TESTING.md) ·
[DEPLOYMENT.md](DEPLOYMENT.md) · [CHANGELOG.md](CHANGELOG.md) · [CLAUDE.md](CLAUDE.md)
