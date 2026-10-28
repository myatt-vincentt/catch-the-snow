// Where the mouth is on screen: a marker at the middle of the mouth on the
// filtered head (canonical cm, between the inner lips), projected every
// frame into screen units for the catching (catching.ts).
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import { CANONICAL_FACE_POSITIONS as P } from "@vincentt-xr/sdk/face-effects";

import { live } from "./live";

const MOUTH = new Vector3()
  .fromArray(P, 13 * 3)
  .add(new Vector3().fromArray(P, 14 * 3))
  .multiplyScalar(0.5);

export const Mouth = () => {
  const marker = useRef<Group>(null);
  const v = useMemo(() => new Vector3(), []);
  useFrame((state) => {
    const m = marker.current;
    if (!m || !live.tracked) {
      live.mouth = null;
      return;
    }
    m.getWorldPosition(v).project(state.camera);
    const aspect = state.size.width / Math.max(1, state.size.height);
    live.mouth = { x: (v.x * aspect) / 2, y: v.y / 2 };
  });
  return <group ref={marker} position={MOUTH} />;
};
