# WonderWorld VR — Product Requirements (MVP scope)

## Problem
Children aged 5–12 learn number sense best by handling things: counting real objects,
pushing piles together, taking some away. Screens mostly offer tap-the-right-answer quizzes.
WonderWorld VR lets children *do* the maths with 3D objects they can grab, in a browser, on a
phone, or inside a Meta Quest headset.

## Users
| User | Needs |
|---|---|
| Child (5–7, "Little Explorers") | Big targets, few objects, numbers 0–10, spoken + visual instructions |
| Child (8–10, "Adventurers") | Numbers to 20, more choices, fewer hints |
| Child (11–12, "Masters") | Larger ranges, multi-step tasks |
| Parent | Create profiles, see real progress, set level, limit session time, gate settings |

## MVP goals (First Deliverable)
1. One colourful 3D classroom hub with portals.
2. Mathematics World with four playable activities: Counting, Number Recognition, Addition, Subtraction.
3. Every answer validated by the learning engine from the *actual* objects placed.
4. Gentle hint after a mistake; difficulty adapts (3 correct → up, 2 wrong in a row → down).
5. Stars, coins, badges, daily goal and streak.
6. Desktop keyboard + mouse, touch, and WebXR (Quest controllers: ray select, grip grab, teleport, snap turn).
7. Local progress persistence (no account needed — demo mode).
8. Parent dashboard (PIN-gated) showing saved progress, level control and session limits.

## Non-goals for the MVP
Geography, Space, Science, Money and Puzzle worlds (shown as "Coming soon", not clickable as if playable);
PostgreSQL backend and parent accounts (Phase 5); hand-tracking polish (works via the XR library's default
hand pointers, not tuned); district-level maps.

## Principles → concrete rules
- **Never punish**: no lives, no timers by default, no "wrong" buzzers; mistakes trigger encouragement + hint.
- **Audio is optional**: every spoken line is also a caption on a 3D board and on the HTML HUD.
- **Comfort**: no forced camera motion in VR, snap turn default, teleport optional, no flashing.
- **Privacy**: nickname + age group + avatar only. No email for children. No analytics SDKs.

## Success criteria
See section 22 of the spec; tracked in `docs/ROADMAP.md` with a status per criterion.
