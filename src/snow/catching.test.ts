import { describe, expect, it } from "vitest";

import {
  CATCH,
  cheeksState,
  mouthOpen,
  spawn,
  stepCheeks,
  stepFlake,
  type Flake,
} from "./catching";

const DT = 1 / 30;
const flakeAt = (x: number, y: number): Flake => ({
  ...spawn(0.28, 0, () => 0.5),
  x,
  y,
});

/** Runs a flake for `seconds`: when it was caught (or null), and where it ended. */
const fly = (
  start: Flake,
  seconds: number,
  open: boolean,
  mouth = { x: 0, y: 0 },
) => {
  let f = start;
  for (let i = 1; i <= seconds / DT; i += 1) {
    const r = stepFlake(f, i * DT, DT, mouth, open);
    f = r.flake;
    if (r.caught) return { at: i * DT, f };
  }
  return { at: null, f };
};

describe("mouthOpen", () => {
  it("opens past `open` and stays open until under `close`", () => {
    expect(mouthOpen(false, 0.25)).toBe(false);
    expect(mouthOpen(false, 0.35)).toBe(true);
    expect(mouthOpen(true, 0.25)).toBe(true);
    expect(mouthOpen(true, 0.1)).toBe(false);
  });
});

describe("stepFlake", () => {
  it("an open mouth draws in a flake falling nearby and catches it", () => {
    expect(fly(flakeAt(0.08, 0.1), 4, true).at).not.toBeNull();
  });

  it("a closed mouth catches nothing", () => {
    expect(fly(flakeAt(0.02, 0.05), 4, false).at).toBeNull();
  });

  it("a flake falling far from the mouth isn't drawn in", () => {
    const r = fly(flakeAt(0.27, 0.2), 4, true, { x: -0.1, y: 0 });
    expect(r.at).toBeNull();
    expect(r.f.x).toBeCloseTo(0.27, 1);
  });

  it("a caught flake flies into the mouth in flyIn seconds", () => {
    const mouth = { x: 0, y: 0 };
    const { flake } = stepFlake(flakeAt(0.03, 0.0), 0, DT, mouth, true);
    expect(flake.state).toBe("in");
    expect(stepFlake(flake, CATCH.flyIn / 2, DT, mouth, true).caught).toBe(
      false,
    );
    const end = stepFlake(flake, CATCH.flyIn, DT, mouth, true);
    expect(end.caught).toBe(true);
    expect(end.flake.x).toBeCloseTo(0);
  });
});

describe("stepCheeks", () => {
  it("each flake fills a step, up to full", () => {
    let c = cheeksState();
    for (let i = 0; i < 10; i += 1) c = stepCheeks(c, i, DT, 1);
    expect(c.fill).toBe(1);
    c = stepCheeks(cheeksState(), 0, DT, 1);
    expect(c.fill).toBeCloseTo(CATCH.fill);
  });

  it("full cheeks hold a moment, then melt back in about 10 s", () => {
    let c = { fill: 1, lastCatch: 0 };
    let t = 0;
    for (; t < CATCH.hold; t += DT) c = stepCheeks(c, t, DT, 0);
    expect(c.fill).toBe(1);
    for (; t < CATCH.hold + 9.5; t += DT) c = stepCheeks(c, t, DT, 0);
    expect(c.fill).toBeGreaterThan(0);
    for (; t < CATCH.hold + 10.5; t += DT) c = stepCheeks(c, t, DT, 0);
    expect(c.fill).toBe(0);
  });

  it("they don't melt while the mouth is open", () => {
    let c = { fill: 0.5, lastCatch: 0 };
    for (let t = 0; t < 20; t += DT) c = stepCheeks(c, t, DT, 0, true);
    expect(c.fill).toBe(0.5);
  });

  it("most new flakes fall near the face", () => {
    let near = 0;
    for (let i = 0; i < 1000; i += 1)
      if (Math.abs(spawn(0.28, 0.1).x - 0.1) <= 0.12) near += 1;
    expect(near).toBeGreaterThan(650);
  });

  it("a catch while melting tops them up again", () => {
    let c = { fill: 0.4, lastCatch: 0 };
    c = stepCheeks(c, 10, DT, 0);
    c = stepCheeks(c, 10.1, DT, 1);
    expect(c.fill).toBeGreaterThan(0.4);
    expect(c.lastCatch).toBe(10.1);
  });
});
