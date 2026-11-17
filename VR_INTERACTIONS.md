# VR & input interactions

One interaction code path for every device: R3F pointer events. `@react-three/xr` turns XR controllers and hands
into pointers that dispatch the same `onPointerDown/Move/Up/Over/Out/Click` events the mouse does.

## Controls
| Action | Desktop | Touch | Quest controllers | Hands (untuned) |
|---|---|---|---|---|
| Hover / highlight | move mouse | — | point ray | point |
| Select / press 3D button | click | tap | **trigger** (ray) | pinch |
| Grab & move object | drag | drag | **trigger** on ray (slides on table) or **grip** near it (carry freely) | pinch / grab |
| Accessible placement | click object, click basket | tap, tap | trigger, trigger | pinch, pinch |
| Move | WASD / arrows, click floor | tap floor | **push stick forward** → arc → **trigger** to land | — |
| Turn | Q / E, drag empty space | drag | flick right stick (snap 30°/45°) or hold (smooth) | — |
| Exit VR | — | — | "Exit VR" on the board, or the Meta button | Meta gesture |

Children press triggers slowly, so a press-and-release up to **700 ms** counts as a click (library default 300 ms).

## Object interaction state machine
`src/engine/interaction/machine.ts` (unit-tested): `idle → hover → selected / grabbed → placedCorrect |
placedIncorrect → (settle) → idle`, with `reset` from any state. Visual treatment per state (`interactionLook`):
scale bump + coloured ring (white hover, gold selected/grabbed, green accepted, orange rejected).

Placement rules: on release, `findZone()` picks the drop zone under the object (forgiving margin). The engine's
`zoneAccepts()` says whether that zone takes that item now. Accepted → the engine records it and the object glides
into its slot; rejected or no zone → it glides home. **Correctness** of the answer is a separate engine decision
(`evaluate()`), made on **Check** (counting) or when a number lands in the golden slot.

## Desktop drag model
Mouse/touch/XR-ray drags project the pointer ray onto the table plane, so objects slide along the table at a
small lift (predictable for children and for mice). XR grip drags follow the controller in 3D. Pointer capture is
taken on grab and released explicitly on drop.

## Teleport
The teleport arc is hidden by default and appears only while that controller's thumbstick is pushed forward
(hysteresis −0.6 / −0.25). Reason: the pointer library activates the pointer with the closest hit, and an always-on
arc hits the floor before distant UI, which would make the trigger teleport instead of select. Landing points are
limited to floors (`TeleportTarget`) and clamped to the room bounds, so you can't land in walls or furniture.
Teleport can be turned off in Settings; every activity works without moving.

## Turning & comfort
`useXRControllerLocomotion` with translation disabled (no stick sliding). Snap turn is the default; smooth turn
is optional and shows a short dark vignette while turning. Turning pivots around the head, not the origin.
Seated mode lowers the table (0.68 m vs 0.78 m) and lifts the origin 0.25 m. When an activity starts in VR the
player is placed at the table once (discrete jump on the child's own action); the camera never moves by itself.

## Haptics
`pulse()` vibrates the controller nearest the event (grab, drop, button press, gentle long pulse on rejection)
using `vibrationActuator.playEffect` or `hapticActuators[0].pulse`, and silently does nothing elsewhere.

## Spatial UI
3D panels are real geometry + SDF text (drei `Text`), so everything needed to play is visible inside the headset:
question board (prompt, live counts, buttons, captions), Pip's speech bubble, zone labels, portals.
Board sits ~1 m from the player at table height; buttons are ≥ 9 cm tall.

## Emulator test plan (automated — `tests/e2e/xr.spec.ts`)
Runs IWER (Quest 3) in headless Chrome and scripts the controllers:
1. Enter VR → visibility `visible`, both controllers tracked.
2. Push left stick forward, aim at floor, trigger → player position moves (teleport).
3. Aim right ray at the Maths portal, trigger → scene switches to Maths World.
4. Aim at the "Counting" board button, trigger → round starts.
5. Move right controller onto an object, **grip**, carry over the basket, release → engine records `tray`.
6. Exit VR → session ends.

Emulated poses are perfectly still, so the test nudges controllers by 1 mm for a few frames after each pose change
(real hands always move; the pointer library re-intersects on movement).

## On-device checklist (still to do on a real Quest)
- [ ] Enter/exit VR from Meta Quest Browser over HTTPS; frame rate ≥ 72 fps in classroom and Maths World.
- [ ] Ray hover/select on portals and every board button, both hands.
- [ ] Grip grab of apples, stars, balls, ducks, number blocks; release into each zone; rejection glide-home.
- [ ] Teleport arc only with stick forward; can't land outside the room; snap/smooth turn; vignette.
- [ ] Seated mode reachability; haptics on grab/drop; Guardian respected.
- [ ] Hand tracking pinch select/grab (expected to work via library defaults; not tuned).
