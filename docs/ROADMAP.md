# Implementation roadmap

Each phase ends with: run app → `npm run typecheck` → `npm run lint` → `npm test` → e2e where relevant → docs.

| Phase | Scope | Status |
|---|---|---|
| 1 Foundation | Vite/TS strict, R3F, XR store + Enter/Exit VR, routing, desktop rig, classroom | ✅ 0.1.0 |
| 2 Interaction engine | Raycast hover/select, grab/release (own `Grabbable`), zones, reset, feedback, haptics | ✅ 0.1.0 |
| 3 First playable world | Maths: counting, number recognition, addition, subtraction; scoring; adaptive difficulty | ✅ 0.1.0 (on-device Quest test pending) |
| 4 Learning platform | Multiplication, number puzzles, Geography (sourced LGD boundaries), Space, Science, Money, rewards polish | ⏳ next |
| 5 Backend | Node API + PostgreSQL, parent auth, profile & progress APIs, `ApiRepository` | ⏳ needs approval for hosting/DB |
| 6 Quality & release | Quest device testing, perf profiling, a11y + security review, deployment | ⏳ |

## Acceptance criteria tracker (spec §22)
| # | Criterion | Status / evidence |
|---|---|---|
| 1 | Opens in desktop browser | ✅ e2e `app.spec.ts` |
| 2 | Enter 3D classroom | ✅ e2e `app.spec.ts` |
| 3 | Keyboard + mouse navigation | ✅ e2e (W walks); drag-look + click-to-walk checked manually |
| 4 | Select + grab 3D objects | ✅ e2e real mouse drags |
| 5 | Complete counting | ✅ e2e `math.spec.ts` |
| 6 | Complete addition | ✅ e2e `math.spec.ts` |
| 7 | Answers validated | ✅ unit `round.test.ts` (every activity) |
| 8 | Hints on incorrect | ✅ unit + e2e (counting and addition) |
| 9 | Difficulty adapts | ✅ unit `difficulty.test.ts`, `persistence.test.ts` |
| 10 | Progress persists after refresh | ✅ e2e reload check |
| 11 | Quest enters immersive VR | 🟡 verified in IWER Quest 3 emulator (e2e `xr.spec.ts`); **physical Quest pending** |
| 12 | Controllers select, grab, release | 🟡 emulator e2e (ray select, grip grab/release); **physical Quest pending** |
| 13 | VR users can teleport | 🟡 emulator e2e; **physical Quest pending** |
| 14 | VR users can exit safely | 🟡 "Exit VR" board button + system menu; emulator e2e; physical pending |
| 15 | Acceptable performance | 🟡 budgets + instancing + code-splitting; **Quest profiling pending** |
| 16 | Dashboard shows saved progress | ✅ e2e `math.spec.ts` |

## Next (Phase 4) — proposed order
1. On-device Quest pass (VR_INTERACTIONS.md checklist) and perf profiling; self-host controller models.
2. Multiplication (groups) and number-sequence puzzles in Maths World.
3. Indian Money world (needs licensed/accurate currency reference art — approval needed for sources).
4. Geography (India map from the LGD boundary data already in `~/Documents/All pets/india-map-explorer/data-raw`, with attribution).
5. Space Explorer, Science Lab, Puzzle Adventure.
