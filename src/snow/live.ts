// Live readings, written every frame (no re-renders).
export const live = {
  blendshapes: {} as Readonly<Record<string, number | undefined>>,
  /** A face is being tracked (FilteredHead). */
  tracked: false,
  /** How stuffed the cheeks are, 0 (as you are) … 1 (full). */
  cheeks: 0,
  /** When (performance.now() s) the last flake landed; −Infinity = never. */
  lastCatch: -Infinity,
  /** The mouth on screen (screen heights, y up, centred), null with no face. */
  mouth: null as { x: number; y: number } | null,
  /** Bumps on each head shake: the pieces play their wobble. */
  shakes: 0,
  /** Dev only (window.__snow): stands in for the face's readings. */
  override: null as Readonly<Record<string, number | undefined>> | null,
};
