// Catching snow — pure, unit-tested (catching.test.ts).
//
// Screen units: heights of the screen, y up, origin in the middle (so a
// 9:16 screen runs x −0.28…0.28, y −0.5…0.5). An open mouth draws nearby
// flakes in, gently, so catching is easy; a flake that reaches it flies in.
// Each catch fills the cheeks a step; once you stop catching they hold a
// moment, then slowly melt back.

export const CATCH = {
  /** Mouth open past this (jawOpen), closed again under that. */
  open: 0.3,
  close: 0.18,
  /** How far an open mouth draws flakes in (screen heights), and how fast at its edge. */
  pull: 0.26,
  pullSpeed: 0.6,
  /** A flake this close to an open mouth is caught. */
  reach: 0.04,
  /** Seconds a caught flake takes to fly in, and at least between two catches. */
  flyIn: 0.22,
  gap: 0.5,
  /**
   * Cheek fill per flake; seconds the cheeks hold after a catch (and the
   * whole time the mouth is open) before melting; melt per second.
   */
  fill: 1 / 6,
  hold: 2,
  melt: 0.1,
};

export type Vec = { x: number; y: number };

export type Flake = {
  x: number;
  y: number;
  /** Fall speed (screen heights / s) and its own sway phase. */
  fall: number;
  phase: number;
  /** Falling, or flying into the mouth since `at` (s) from `from`. */
  state: "fall" | "in";
  at: number;
  from: Vec;
};

/** The mouth's open state, with a little hysteresis. */
export const mouthOpen = (wasOpen: boolean, jaw: number, cfg = CATCH) =>
  wasOpen ? jaw > cfg.close : jaw > cfg.open;

/**
 * A new flake above the screen: most fall near `near` (the face's x), so
 * they come to you; the rest anywhere across.
 */
export const spawn = (
  halfWidth: number,
  near = 0,
  random = Math.random,
): Flake => ({
  x:
    random() < 0.7
      ? Math.max(
          -halfWidth,
          Math.min(halfWidth, near + (random() * 2 - 1) * 0.12),
        )
      : (random() * 2 - 1) * halfWidth * 0.85,
  y: 0.55 + random() * 0.35,
  fall: 0.05 + random() * 0.05,
  phase: random() * Math.PI * 2,
  state: "fall",
  at: 0,
  from: { x: 0, y: 0 },
});

/**
 * One flake, one frame. `mouth` is null while there's no face. Returns the
 * flake's next state and whether it just landed in the mouth.
 */
export const stepFlake = (
  f: Flake,
  t: number,
  dt: number,
  mouth: Vec | null,
  open: boolean,
  cfg = CATCH,
): { flake: Flake; caught: boolean } => {
  if (f.state === "in") {
    const k = Math.min(1, (t - f.at) / cfg.flyIn);
    const to = mouth ?? f.from;
    return {
      flake: {
        ...f,
        x: f.from.x + (to.x - f.from.x) * k,
        y: f.from.y + (to.y - f.from.y) * k,
      },
      caught: k >= 1,
    };
  }
  let x = f.x + Math.sin(t * 0.8 + f.phase) * 0.012 * dt;
  let y = f.y - f.fall * dt;
  if (mouth && open) {
    const dx = mouth.x - x;
    const dy = mouth.y - y;
    const d = Math.hypot(dx, dy);
    if (d < cfg.reach)
      return {
        flake: { ...f, x, y, state: "in", at: t, from: { x, y } },
        caught: false,
      };
    if (d < cfg.pull) {
      const step = Math.min(d, cfg.pullSpeed * (1 - d / cfg.pull) * dt);
      x += (dx / d) * step;
      y += (dy / d) * step;
    }
  }
  return { flake: { ...f, x, y }, caught: false };
};

export type Cheeks = {
  /** 0 (as you are) … 1 (full). */
  fill: number;
  /** When the last flake landed (s); −Infinity = never. */
  lastCatch: number;
};

export const cheeksState = (): Cheeks => ({ fill: 0, lastCatch: -Infinity });

/**
 * The cheeks after `caught` flakes landed this frame; `trying` (mouth open)
 * keeps them from melting.
 */
export const stepCheeks = (
  c: Cheeks,
  t: number,
  dt: number,
  caught: number,
  trying = false,
  cfg = CATCH,
): Cheeks => {
  if (caught > 0)
    return { fill: Math.min(1, c.fill + caught * cfg.fill), lastCatch: t };
  if (trying || t - c.lastCatch < cfg.hold || c.fill <= 0) return c;
  return { ...c, fill: Math.max(0, c.fill - cfg.melt * dt) };
};
