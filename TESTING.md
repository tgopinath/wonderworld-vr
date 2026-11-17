# Testing

## Automated
| Layer | Tool | Command | Covers |
|---|---|---|---|
| Unit | Vitest (jsdom) | `npm test` | Round generation for every activity × level, validation (counting/recognition/addition/subtraction), hints, adaptive difficulty, rewards (stars, badges, daily goal, streaks, medal), interaction state machine, zone geometry, LocalRepository (round-trip, corrupt data), PIN hashing, store round completion + profile deletion |
| Browser | Playwright + installed Chrome | `npm run test:e2e` | Welcome → profile → classroom; keyboard walking; locked worlds inert; parent gate; **counting with real mouse drags** (wrong → hint → right → reward → reload persists); **addition with real drags** (wrong number → hint → right number → stars) → parent dashboard shows the saved round |
| WebXR emulator | Playwright + IWER Quest 3 | `npm run test:e2e` (`xr.spec.ts`) | Enter VR, teleport, ray select portal + board button, grip grab → carry → release into basket, exit VR |

Current result (2026-11-17): **46/46 unit tests, 6/6 browser tests passing**; typecheck and lint clean.

Notes:
- E2E uses the installed Google Chrome (`channel: 'chrome'`) with SwiftShader WebGL. Set `PW_CHANNEL=` to use
  Playwright's own Chromium (`npx playwright install chromium` first).
- Headless software WebGL renders ~6 fps; helpers wait on the camera glide and on rendered frames
  (`__ww.frames()`), never on fixed sleeps alone.
- Tests read object positions from the read-only `window.__ww` bridge, then perform real pointer input.

## Manual checks done (desktop Chrome, in-app browser)
Welcome, profile creation, worlds page, classroom render, Maths portal, counting (drag + tap-to-place + hint +
success), addition (combine + answer), find-the-number wrong answer → hint, parent gate + PIN + dashboard data,
progress persisted after reload.

## Not yet done
- Physical Meta Quest (see the on-device checklist in VR_INTERACTIONS.md).
- Physical phones/tablets (touch flows are implemented and use the same pointer path).
- Subtraction has unit coverage and the same UI path as addition, but no e2e test yet.
- Accessibility audit with a screen reader; colour-contrast audit of 3D labels.

## Performance budgets (to verify on Quest 2/3)
- ≥ 72 fps; ≤ 150 draw calls; ≤ 300k triangles per scene; one shadow-casting light, 1024² shadow map.
- Repeated scenery is instanced (books, trees, fence, confetti); item geometries/materials are shared module-level.
- Worlds are code-split (`MathWorldScene` loads on demand); emulator code is stripped from production builds.
- No React state updates inside `useFrame`; per-frame work mutates refs only.
- Fixed foveation 1.0 and `frameRate: 'high'` requested on Quest.
How to profile: Quest Browser → chrome://inspect from a desktop Chrome, Performance panel; OVR Metrics Tool for
GPU/CPU level and frame timing.
