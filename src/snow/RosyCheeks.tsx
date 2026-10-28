// Cold rosy cheeks: the SDK's blush on the apples of the cheeks, a cold
// pinkish red, a light flush from the start that deepens as the cheeks fill
// with snow. Inside the face tracker, so FaceLiquify's warp bends it with
// the face. The opacity steps in small increments (a prop, so a re-render).
import { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Blush } from "@vincentt-xr/sdk/face-effects";

import { live } from "./live";

const ROSY = {
  color: "#e5486a",
  /** Opacity empty and full. */
  rest: 0.28,
  full: 0.75,
  /** Bigger than a made-up blush, low toward the pouches. */
  size: 1.35,
  lift: -0.35,
  /** Opacity steps (fewer re-renders). */
  step: 0.04,
};

export const RosyCheeks = () => {
  const [opacity, setOpacity] = useState(ROSY.rest);
  useFrame(() => {
    const want = ROSY.rest + (ROSY.full - ROSY.rest) * live.cheeks;
    const next = Math.round(want / ROSY.step) * ROSY.step;
    if (Math.abs(next - opacity) > 1e-3) setOpacity(next);
  });
  return (
    <Blush
      shape="apples"
      color={ROSY.color}
      opacity={opacity}
      finish="matte"
      size={ROSY.size}
      lift={ROSY.lift}
      softness={0.9}
    />
  );
};
