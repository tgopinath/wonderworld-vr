# Architecture

XR framework decision: [docs/adr/0001-xr-framework.md](docs/adr/0001-xr-framework.md).

## Layering rule
```
 ui/ (React DOM, Tailwind)        three/ (R3F scenes + XR)
          \                          /
           state/ (Zustand stores — the only bridge)
                       |
             engine/ (pure TypeScript: no React, no three)
                       |
             persistence/ (Repository interface → LocalRepository | ApiRepository)
```
- `engine/` never imports React, three or the DOM. It is fully unit-tested.
- Scene components never decide whether an answer is right. They report *facts*
  ("item `apple-3` is now in zone `tray`") to the activity runtime and render whatever state comes back.
- Activity content (ranges, item kinds, number of choices, hint rules) lives in `src/config/activities.ts`
  as data, not in scene code.

## Module map (spec §2)
| # | Module | Location |
|---|---|---|
| 1 | Application interface | `src/ui/pages`, `src/ui/components`, `src/app` |
| 2 | 3D rendering engine | `src/three/scenes`, `src/three/components` |
| 3 | XR session management | `src/three/xr.ts` (store, enter/exit, haptics), `src/three/xrSupport.ts`, `src/three/devEmulator.ts` (dev only) |
| 4 | Desktop & mobile input | `src/three/rig/DesktopRig.tsx` |
| 5 | VR controller & hand input | `src/three/xr.ts` (pointer config, 700 ms kid click threshold), `src/three/rig/XRRig.tsx` (snap/smooth turn, stick-gated teleport arc, vignette) |
| 6 | Object interaction system | `src/engine/interaction/` (state machine, zones) + `src/three/components/Grabbable.tsx`, `DropZone.tsx` |
| 7 | Educational activity engine | `src/engine/learning/` |
| 8 | Adaptive difficulty | `src/engine/difficulty/` |
| 9 | Rewards & achievements | `src/engine/rewards/` |
| 10 | Progress & persistence | `src/state/progressStore.ts`, `src/persistence/` |
| 11 | Parent dashboard | `src/ui/pages/ParentPage.tsx` |
| 12 | Audio & animation | `src/audio/audio.ts` (speech, synthesized + spatial sfx, music), `src/three/components/RewardBurst.tsx`, `Guide.tsx` |

Physics: Rapier is **not** used in the MVP. Placement is decided by zone containment on release
(`engine/interaction/zones.ts`), which is deterministic and testable. Rapier can be added for
free-fall/stacking toys later without touching the engine.

## Routes
| Path | Page |
|---|---|
| `/` | Welcome (animated 3D background, start / continue / parents, device indicator, audio) |
| `/profiles` | Child profile picker + create |
| `/worlds` | World selection (2D fallback list; 3D portals are in the classroom) |
| `/play` | The single `<Canvas>` — classroom hub and worlds switch *inside* it so a VR session survives navigation |
| `/parent` | PIN-gated dashboard |
| `/settings` | Audio + comfort settings |

## 3D component hierarchy
```
PlayPage
└─ <Canvas>
   └─ <XR store>
      ├─ Lighting (hemisphere + 1 shadow-casting directional)
      ├─ PlayerRig  ── DesktopRig (WASD/drag/tap-to-walk)  |  XRRig (XROrigin, teleport, snap turn)
      ├─ SpatialAudioListener
      ├─ SceneSwitch (sceneStore.scene)
      │   ├─ ClassroomScene: Room, Desks, Bookshelves(instanced), DisplayBoard, Portal×6, Guide
      │   └─ MathWorldScene: Playground, Guide, ActivityMenu (3D buttons)
      │        └─ ActivityStage (one of)
      │             CountingStage | NumberRecognitionStage | AdditionStage | SubtractionStage
      │               built from: Grabbable(Item | NumberBlock), DropZone(Basket | Slot), QuestionBoard
      ├─ RewardBurst (on round complete)
      └─ CaptionBoard (follows guide line)
HTML overlay: Hud (stars, coins, daily goal, streak, caption, Enter VR, classroom, mute, help, exit),
              WorldLoading, SessionTimers (learning time, break reminder, session limit)
```

## Object interaction state machine (`engine/interaction/machine.ts`)
```
            hoverIn            select/grab
   idle ───────────▶ hover ───────────────▶ grabbed
    ▲  ◀─────────────  │                      │ release
    │    hoverOut      │ select (click)       ▼
    │                  ▼                  released ──zone accepts──▶ placedCorrect ─┐
    │               selected                 │                                       │
    │                                        └──zone rejects / no zone─▶ placedIncorrect
    │                                                                    │ (auto, 0.8s)
    └────────────────────────── reset ◀──────────────────────────────────┘
```
`reset` is valid from every state and returns the object to its spawn transform.
`placedCorrect` means "accepted by the zone it was dropped in" (e.g. any apple in the counting tray).
Whether the *answer* is right is a separate engine decision made when the child presses **Check**
or drops a number in the answer slot.

## Activity runtime contract (`engine/learning/runtime.ts`)
```ts
createRound(activityType, levelConfig, rng) → Round            // what to spawn, the question
placeItem(roundState, itemId, zoneId | null) → RoundState        // fact from the 3D layer
evaluate(round, roundState) → { correct, reason, hint? }       // the only place answers are judged
```

## Data models (front end, see `src/engine/core/types.ts`; DB mapping in DATABASE_SCHEMA.md)
- `ChildProfile { id, nickname, ageGroup, avatarId, preferences, createdAt }`
- `ActivityProgress { activityId, level, streakCorrect, streakIncorrect, attempts, correct, incorrect, bestStars }`
- `ActivityAttempt { id, profileId, activityId, level, correct, mistakes, hintsUsed, stars, durationMs, completedAt }`
- `RewardState { stars, coins, badges[], dailyGoal, dailyProgress{date,count}, streak{current,best,lastDate} }`
- `Settings { masterVolume, music, sfx, narration, captions, comfort{turn, snapDegrees, teleport, vignette, mode} }`
- `ParentSettings { pinHash, salt, sessionLimitMin, breakReminderMin, levelOverrides }`

## Testing bridge
`src/three/components/debug.ts` exposes a read-only `window.__ww` in dev builds (or with `?e2e`) so browser tests can
find objects on screen and drive real pointer input. See TESTING.md.

## Persistence
`Repository` interface with `LocalRepository` (localStorage, versioned key `ww:v1`, schema-migrating).
`ApiRepository` (Phase 5) will implement the same interface against the Node API. Demo mode = local.
