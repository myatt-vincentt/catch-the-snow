// The only hint, wordless and in the scene: at the start, and when nothing
// has been caught for a while, a ghost face (the SDK's FaceExpressionHint)
// appears by the shoulder and opens its mouth wide. It fades in and out
// (strict ease-out). On the filtered head, canonical cm.
import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import type { Group } from "three";
// eslint-disable-next-line import/extensions
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
// eslint-disable-next-line import/extensions
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FaceExpressionHint } from "@vincentt-xr/sdk/instructions";

import { live } from "./live";

const HINT = {
  /** Seconds after the face appears, then after the last catch, before it shows. */
  first: 3,
  idle: 10,
  /** Seconds it stays. */
  show: 2.8,
  /** By the shoulder (cm), turned in toward the camera, and its height. */
  at: [13, -15, 8] as const,
  turn: -0.4,
  height: 10,
  renderOrder: 15,
};

const FACE_URL = "/models/face-v1.glb";
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export const MouthHint = () => {
  // face-v1.glb is meshopt-compressed: the loader needs the decoder.
  const face = useLoader(GLTFLoader, FACE_URL, (l) =>
    l.setMeshoptDecoder(MeshoptDecoder),
  );
  const g = useRef<Group>(null);
  const shownAt = useRef(-1);
  const seenAt = useRef(-1);
  const quietSince = useRef(0);
  const model = useMemo(() => face.scene, [face]);

  useFrame(() => {
    const o = g.current;
    if (!o) return;
    const t = performance.now() / 1000;
    if (!live.tracked) {
      seenAt.current = -1;
      shownAt.current = -1;
      o.visible = false;
      return;
    }
    if (seenAt.current < 0) seenAt.current = t;
    const caught = Number.isFinite(live.lastCatch);
    const since = Math.max(
      caught ? live.lastCatch : 0,
      quietSince.current,
      seenAt.current,
    );
    const wait = caught ? HINT.idle : HINT.first;
    // Start one when it's been quiet long enough; stop at once on a catch.
    if (shownAt.current < 0 && t - since > wait) shownAt.current = t;
    if (shownAt.current < 0) {
      o.visible = false;
      return;
    }
    const age = t - shownAt.current;
    if (age > HINT.show || (caught && live.lastCatch > shownAt.current)) {
      // Done (or someone caught one): wait the idle time again.
      quietSince.current = t;
      shownAt.current = -1;
      o.visible = false;
      return;
    }
    o.visible = true;
    const fadeIn = easeOut(Math.min(1, age / 0.35));
    const fadeOut = easeOut(Math.min(1, (HINT.show - age) / 0.35));
    o.scale.setScalar(Math.max(1e-4, Math.min(fadeIn, fadeOut)));
  });

  return (
    <group ref={g} position={HINT.at} visible={false}>
      <group rotation-y={HINT.turn}>
        <FaceExpressionHint
          expression="surprised"
          model={model}
          height={HINT.height}
          orbit={0}
          renderOrder={HINT.renderOrder}
        />
      </group>
    </group>
  );
};
