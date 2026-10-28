// Snow falling in your room, behind you and in front of you. Two layers of
// soft round flakes drawn straight in screen space (the whole sky is one
// draw call each): far flakes, small and slow, fall behind you (hidden
// wherever the portrait mask says you are, and behind the hat);
// near flakes, big, soft and quicker, fall in front of everything.
import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry } from "three";
import { usePersonMaskTexture } from "@vincentt-xr/sdk";

import { personMask } from "./personMask";

type Layer = {
  count: number;
  /** Flake size in CSS px, smallest to largest. */
  size: [number, number];
  /** Screen heights per second, slowest to fastest. */
  speed: [number, number];
  /** Side-to-side drift (screen widths) and how bright the flakes are. */
  sway: number;
  alpha: number;
  /** Hidden where you are (the far layer). */
  behind: boolean;
};

const FAR: Layer = {
  count: 260,
  size: [3, 8],
  speed: [0.05, 0.1],
  sway: 0.02,
  alpha: 0.75,
  behind: true,
};
const NEAR: Layer = {
  count: 36,
  size: [12, 26],
  speed: [0.12, 0.2],
  sway: 0.04,
  alpha: 0.85,
  behind: false,
};

const vertexShader = /* glsl */ `
  attribute vec4 seed;
  uniform float time;
  uniform vec2 size;
  uniform vec2 speed;
  uniform float sway;
  uniform float pixelRatio;
  uniform float depth;
  varying float vSoft;
  void main() {
    float fall = mix(speed.x, speed.y, seed.y);
    // 2.4 screen heights a lap, so a flake is off screen a while before it
    // comes round again; each starts at its own place.
    float y = 1.2 - mod(time * fall * 2.0 + seed.z * 2.4, 2.4);
    float x = seed.x * 2.2 - 1.1
      + sin(time * (0.6 + seed.w) + seed.w * 6.2832) * sway * 2.0;
    gl_Position = vec4(x, y, depth, 1.0);
    gl_PointSize = mix(size.x, size.y, seed.y) * pixelRatio;
    vSoft = seed.w;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float alpha;
  uniform float behind;
  uniform sampler2D personMask;
  uniform vec2 personMaskSize;
  varying float vSoft;
  void main() {
    if (behind > 0.5 &&
        texture2D(personMask, gl_FragCoord.xy / personMaskSize).g > 0.5)
      discard;
    float d = length(gl_PointCoord - 0.5) * 2.0;
    // A bright core with a soft edge; some flakes softer than others.
    float a = smoothstep(1.0, 0.15 + 0.35 * vSoft, d);
    if (a <= 0.0) discard;
    gl_FragColor = vec4(vec3(0.94, 0.97, 1.0), a * alpha);
  }
`;

const seeds = (count: number) => {
  const a = new Float32Array(count * 4);
  for (let i = 0; i < a.length; i += 1) a[i] = Math.random();
  return a;
};

const Flakes = ({ layer }: { layer: Layer }) => {
  const gl = useThree((s) => s.gl);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    // Positions are made in the shader; three still wants one to count.
    g.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(layer.count * 3), 3),
    );
    g.setAttribute("seed", new BufferAttribute(seeds(layer.count), 4));
    return g;
  }, [layer]);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      size: { value: layer.size },
      speed: { value: layer.speed },
      sway: { value: layer.sway },
      alpha: { value: layer.alpha },
      pixelRatio: { value: 1 },
      // Far flakes sit at the back, so the hat hides them.
      depth: { value: layer.behind ? 0.999 : -0.999 },
      behind: { value: layer.behind ? 1 : 0 },
      personMask: personMask.mask,
      personMaskSize: personMask.size,
    }),
    [layer],
  );
  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime;
    uniforms.pixelRatio.value = gl.getPixelRatio();
  });
  return (
    <points
      geometry={geometry}
      frustumCulled={false}
      // The near flakes draw after the cheeks' warp (998), so they stay sharp.
      renderOrder={layer.behind ? -997 : 999}
    >
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        depthTest={layer.behind}
        toneMapped={false}
      />
    </points>
  );
};

/** Keeps the shared portrait mask (personMask.ts) and the drawing size current. */
const MaskFeed = () => {
  const { texture } = usePersonMaskTexture();
  useFrame((state) => {
    personMask.mask.value = texture ?? null;
    state.gl.getDrawingBufferSize(personMask.size.value);
  });
  return null;
};

export const Snow = () => (
  <>
    <MaskFeed />
    <Flakes layer={FAR} />
    <Flakes layer={NEAR} />
  </>
);
