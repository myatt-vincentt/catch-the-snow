// Catch the Snow: snow falling in your room, behind you and in front of you;
// the Christmas outfit on the filtered head (FilteredHead.tsx: the SDK's
// canonical head fit through a spring, with the depth-only head occluder in
// the same group); and your own cheeks, stuffed with the snow you catch, on
// the live face (Cheeks.tsx). Open your mouth near a falling crystal flake
// and it flies in (Catch.tsx); a ghost face by the shoulder shows how. The pieces are in metres in the Spark AR face
// frame; FRAME turns them into canonical centimetres.
import { Suspense, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
// eslint-disable-next-line import/extensions
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useFaceInfo, useGesture } from "@vincentt-xr/sdk/tracking";

import { Catch } from "./Catch";
import { Cheeks } from "./Cheeks";
import { FACE_FPS, FilteredHead } from "./FilteredHead";
import { live } from "./live";
import { Mouth } from "./Mouth";
import { MouthHint } from "./MouthHint";
import { FRAME, OUTFIT } from "./outfit";
import { Part } from "./Part";
import { RosyCheeks } from "./RosyCheeks";
import { Snow } from "./Snow";
import { SnowDrift } from "./SnowDrift";

/** The blendshapes the pieces' face_triggers read (see rig.ts). */
const FACE_INPUTS = [
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "browInnerUp",
  "browDownLeft",
  "browDownRight",
  "mouthPucker",
  "cheekPuff",
];
/** Per-second easing of the readings (higher = snappier, noisier). */
const FACE_EASE = 14;

/** Copies the face's blendshapes into `live` and counts head shakes. */
const FaceSignals = () => {
  // Same options as FilteredHead's FaceTracker: the first consumer of the
  // shared face model sets its face count and rate.
  const face = useFaceInfo({ active: true, numFaces: 1, targetFps: FACE_FPS });
  const raw = useRef<Readonly<Record<string, number | undefined>>>({});
  raw.current = face?.blendshapes ?? {};
  // Raw blendshapes flicker a few percent frame to frame; ease toward them.
  const smooth = useRef<Record<string, number>>({});
  useFrame((_st, dt) => {
    const k = 1 - Math.exp(-FACE_EASE * Math.min(dt, 0.1));
    const out = smooth.current;
    FACE_INPUTS.forEach((name) => {
      const v = raw.current[name] ?? 0;
      out[name] = (out[name] ?? v) + (v - (out[name] ?? v)) * k;
    });
    live.blendshapes = out;
  }, -1);
  useGesture("headShake", {
    onBegin: () => {
      live.shakes += 1;
    },
  });
  return null;
};

/** Soft studio reflections, so the hat's fur and the nose read on camera. */
const useStudioLight = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const before = scene.environment;
    scene.environment = tex;
    return () => {
      scene.environment = before;
      tex.dispose();
    };
  }, [gl, scene]);
};

export const SnowScene = () => {
  useStudioLight();
  return (
    <>
      <Snow />
      <SnowDrift />
      <FaceSignals />
      <Catch />
      <FilteredHead
        onFace={
          <>
            <RosyCheeks />
            <Cheeks />
          </>
        }
      >
        <group name="snow-frame" scale={FRAME.scale} position={FRAME.position}>
          {OUTFIT.map((p) => (
            <Part key={p.id} part={p} />
          ))}
        </group>
        <Mouth />
        <Suspense fallback={null}>
          <MouthHint />
        </Suspense>
      </FilteredHead>
    </>
  );
};
