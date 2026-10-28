# Plan — Catch the Snow

A gentle Christmas play: catch snowflakes in your mouth until your cheeks are full. Built on SDK
2.0.0-alpha.9 with the vincentt.studio head accessories.

## Design

- One outfit the whole time: a Santa hat and a glowing reindeer nose. No beard: it would hide the
  cheeks.
- Snow falls in your real room, behind you and in front of you, onto a snowdrift along the
  bottom of the screen.
- Big crystal snowflakes are the ones you catch. Open your mouth and the nearest drifts in, one
  at a time, with a burst of sparkles and a jiggle of the cheeks.
- Each catch puffs the cheeks out a step and makes them rosier; six fill them. Full cheeks stay
  full while the mouth is open, then slowly melt back once you stop.
- No score, no sound, no text. At the start and when idle, a small 3D ghost face by the shoulder
  opens its mouth wide.

## How it works

- `outfit.ts`: the hat and the nose. `Part.tsx`: loads a piece (shared cache), applies its preset,
  plays its idle loops, mirrors the face through its authored face triggers (`rig.ts`), wobbles on
  a head shake; a `sharp` piece draws after the cheeks' warp.
- `FilteredHead.tsx` + `headFilter.ts` (unit-tested): the SDK's canonical head fit through a
  speed-adaptive critically damped spring, the depth-only v3 head occluder in the same group, the
  SDK's `NeckOccluder` in the face tracker, which also hosts the live-face pieces. Face model
  20 Hz.
- `Cheeks.tsx`: the SDK's `FaceLiquify` with two custom warps a side (a bulge low on the cheek, a
  push out at the jaw), faded in by the fill, with a jiggle on each catch. `RosyCheeks.tsx`: the
  SDK's `Blush` on the apples, its opacity following the fill.
- `catching.ts` (unit-tested): screen units; the mouth opens past jawOpen 0.3 (closes under
  0.18); an open mouth draws flakes in from 0.26 of the screen height and catches them within
  0.04, at least 0.5 s apart; a sixth of a fill per catch; no melting while the mouth is open,
  then a 2 s hold and 0.1 a second.
- `Mouth.tsx`: the middle of the mouth on the filtered head, projected to the screen. `Catch.tsx`:
  the crystal flakes and the sparkles, one draw call in screen space.
- `Snow.tsx`: two layers of falling flakes in screen space, the far one hidden where the portrait
  mask is (`personMask.ts`). `SnowDrift.tsx`: the snowdrift, one shader quad.
- `MouthHint.tsx`: the SDK's `FaceExpressionHint` (`face-v1.glb`) by the shoulder, 3 s after the
  face appears and after every 10 s without a catch.
- Dev only: `DevKeys.tsx` (O mouth open, C / 0 / 9 cheeks, `window.__snow`),
  `DevMediaSwitcher.tsx`, `?occ`.

## Known limits

- A hand resting on a cheek bends with the face while the cheeks are full.
- The warp works on the face as the camera sees it; a strongly turned head shows less of the far
  cheek's swell.
