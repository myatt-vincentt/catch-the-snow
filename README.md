# Catch the Snow

Snow falls in your room, behind you and in front of you, onto a snowdrift along the bottom of the
screen. You wear a Santa hat and a glowing reindeer nose. Among the flakes, big crystal snowflakes
drift down: open your mouth and the nearest one floats in, lands with a burst of sparkles, and
your cheeks puff up a step, rosier each time, like a chipmunk stuffed with snow. Six fill them.
They stay full while your mouth is open; close it and they slowly melt back. No score, no text:
a ghost face by your shoulder opens its mouth to show the move.

- The cheeks are your own face, bent by the SDK's `FaceLiquify` (`src/snow/Cheeks.tsx`): a
  pouch on each cheek and the jaw pushed out, soft-edged warps that never fold, whatever the
  expression. The cold flush is the SDK's `Blush`, under the warp so it swells with the face.
  The reindeer nose draws after the warp, so it stays round.
- Catching (`src/snow/catching.ts`, unit-tested): an open mouth draws nearby crystal flakes in,
  one at a time; each fills the cheeks a sixth; they melt back about ten seconds after you stop.
- The pieces are vincentt.studio head accessories on the SDK's canonical head fit, steadied by a
  speed-adaptive spring with the head occluder in the same group. The snow and the snowdrift are
  drawn straight in screen space; the far flakes hide behind you using the portrait mask.
- Thumbnail: `public/images/catch-the-snow-thumbnail.jpg` (the share image).
- Models: `public/models/vincentt-*.glb` (`src/snow/outfit.ts`); the hint face is
  `face-v1.glb`. Credits in `CREDITS.md`.
- Dev preview without a camera: the media switcher starts on `dev-media/snow.mp4` if you add one,
  else the SDK's sample video; O holds the mouth open, C / 0 / 9 set the cheeks; `?occ` draws the
  occluders. How it works: `PLAN.md`.

---

# v2-template

The Vincentt starter app: a real React + R3F + Vincentt XR SDK (`@vincentt-xr/sdk`)
WebXR app, bundled by esbuild.

## Shape

```
src/
  main.tsx            mount — never edited
  App.tsx             protected shell: XRProvider + AspectRatioContainer +
                      XRScene + media-source binding, camera, lighting,
                      VideoBackground, PreviewAnchors — never edited
  Scene.tsx           the agent's surface: add SDK components and R3F
                      primitives here
  PreviewAnchors.tsx  editor-preview integration — never edited
```

See `AGENTS.md` and `GROUNDING.md` for the API reference and how to author scenes.

## Develop

```
pnpm install
pnpm dev          # esbuild dev server on localhost:5173 (output in .dev/)
pnpm preview      # on-device preview over a secure tunnel (needs `vincentt login`)
pnpm typecheck
pnpm build        # production bundle to dist/
```

## Release

`vincentt init` scaffolds from the **`latest` tag**, not from `main`. Merging to `main` does
not ship a template to creators — cutting a release does.

```
git tag 1.1.0 <sha>      # bare semver, no `v` prefix
git push origin 1.1.0    # the Release workflow verifies the tag, then moves `latest`
```

The Release workflow (`.github/workflows/release.yml`) installs from the frozen lockfile,
builds, and typechecks **the tagged tree** before force-updating `latest` to it. A tag that
fails leaves `latest` where it was, so a broken release cannot reach a new creator.

The job runs in the `release` environment, which accepts bare-semver tags only. To re-run it by
hand, dispatch it from the tag itself ("Use workflow from: 1.1.0"); a dispatch from `main` is
refused.

**Never move `latest` by hand.** It is force-updated by that workflow and nowhere else; moving
it manually decouples the pointer from the version it claims to be.

Creators can pin a specific version — `vincentt init --template 1.0.0` — which is the escape
hatch when a release turns out to be bad. That is why the version tags are immutable and only
`latest` moves.

### `MIGRATION.md` and the platform release row

Root `MIGRATION.md` carries one entry per released tag, newest first, authored in the same
PR as the change: `required: true|false`, a one-line summary, and optional notes bullets.
`required: false` means no consumer action is needed, never that the entry was skipped. The
Release workflow refuses to move `latest` for a tag with no valid entry, then — once `latest`
has moved — posts that entry as this release's row to the platform (`POST
/platform/releases`, component `template`), via `scripts/release-row.mjs`. Both steps read
`MIGRATION.md` from `main`, not from the tagged tree: the note is reviewed via PR into `main`
and is append-only per version, so `main`'s copy is the reviewed source for any tag, including
one cut before this file existed. That row is what `vincentt outdated` reads back to tell a
creator's agent what changed and what to do about it.
