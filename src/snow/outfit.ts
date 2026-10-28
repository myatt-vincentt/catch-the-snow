// The Christmas outfit, worn the whole time: a Santa hat and a reindeer nose
// (no beard: it would hide the stuffed cheeks). vincentt.studio head accessories
// (public/models/vincentt-*.glb), authored in metres in the "Complete 3D
// Reference - Spark AR" face frame (origin at the front of the face, +Y up,
// +Z out of the face) — see FRAME.

export type Part = {
  /** File name in public/models without `vincentt-` / `.glb`. */
  id: string;
  /**
   * One of the file's own presets, by name: its finish, and its colour
   * variant of every material that has one (`mat_x` → `mat_x__<preset>`).
   * The first preset when unset.
   */
  preset?: string;
  /** Material swaps by name, to another material in the same file. */
  materials?: Record<string, string>;
  /** Tints by material name (on this part's own copy of the material). */
  colors?: Record<string, string>;
  /** Fine placement: `x` / `y` / `z` canonical cm, `scale` about its middle. */
  fit?: { x?: number; y?: number; z?: number; scale?: number };
  /** Always behind you: hidden wherever the portrait mask is (personMask.ts). */
  behindPerson?: boolean;
  /**
   * Drawn after the cheeks' warp (FaceLiquify), so the warp never bends or
   * smears it: the whole piece, glow included.
   */
  sharp?: boolean;
  /** Opacity of its glow halos (materials named `…halo…`), against the file's. */
  halo?: number;
};

export const OUTFIT: readonly Part[] = [
  { id: "santa-hat" },
  // Its glow softened: full strength it washes over the face close up.
  { id: "nose-reindeer", sharp: true, halo: 0.45 },
];

export const modelUrl = (id: string) => `/models/vincentt-${id}.glb`;

/** The SDK's v3 head occluder, hosted here until the SDK CDN serves it. */
export const OCCLUDER_URL = "/models/head-occluder-v3.glb";

/** The SDK's neck-and-shoulders bust occluder (same story). */
export const NECK_OCCLUDER_URL = "/models/neck-occluder-bust-v1.glb";

/**
 * The models' frame → the SDK's canonical head frame (centimetres): ×100,
 * then the same shift the SDK used to move the Spark AR reference into the
 * canonical frame (chins and nose tips aligned; vincentt-xr-sdk
 * assets-src/head-occluder/README.md).
 */
export const FRAME = {
  scale: 100,
  position: [0, -1.03, 7.3] as const,
};
