// The stuffed cheeks: your own face, its cheeks blown out round as if full
// of snow. The SDK's FaceLiquify bends the picture itself on the live face:
// each warp is a soft circle that fades to nothing at its edge and never
// folds, so the face's outline swells smoothly with no seams, whatever the
// expression. Two warps a side: a pouch (bulge) low on the cheek, and the
// jaw pushed out. live.cheeks fades them in, with a jiggle on each catch.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  FaceLiquify,
  type FaceLiquifyCustomWarps,
} from "@vincentt-xr/sdk/face-effects";

import { live } from "./live";

/** In eye distances (x toward the person's own left, y up the face). */
const WARPS: FaceLiquifyCustomWarps = {
  pouch: {
    kind: "bulge",
    at: "leftCheek",
    offset: [0.05, -0.35],
    radius: 0.95,
    strength: 0.95,
    mirror: true,
  },
  widen: {
    kind: "push",
    at: "leftFaceSide",
    offset: [-0.05, -0.35],
    radius: 1,
    strength: 0.85,
    direction: [1, -0.1],
    mirror: true,
  },
};

/** The jiggle on each catch: size (in fill), speed (rad/s), length (s). */
const WOBBLE = { amount: 0.12, rate: 28, time: 0.7 };

export const Cheeks = () => {
  const weight = useRef(0);
  useFrame(() => {
    const age = performance.now() / 1000 - live.lastCatch;
    const wobble =
      age < WOBBLE.time
        ? WOBBLE.amount * Math.sin(age * WOBBLE.rate) * Math.exp(-age * 7)
        : 0;
    weight.current = Math.min(1, Math.max(0, live.cheeks + wobble));
  });
  return <FaceLiquify warps={WARPS} weight={weight} />;
};
