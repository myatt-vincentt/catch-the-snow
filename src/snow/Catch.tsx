// The flakes you can catch, and what happens when you do. A handful of big
// crystal snowflakes fall in front of everything; open your mouth near one
// and it drifts in (catching.ts), flies into your mouth with a burst of
// sparkles, and your cheeks fill a step (live.cheeks, read by Cheeks.tsx).
// Drawn straight in screen space.
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry } from "three";

import {
  CATCH,
  mouthOpen,
  spawn,
  stepCheeks,
  stepFlake,
  type Flake,
} from "./catching";
import { live } from "./live";

const FLAKES = {
  count: 12,
  /** Flake size (CSS px); it shrinks flying in. */
  size: 44,
  /** Sparkles per catch, how far they fly (screen heights), how long (s). */
  sparkles: 12,
  burst: 0.07,
  sparkleLife: 0.5,
  sparkleSize: 9,
};

const vertexShader = /* glsl */ `
  attribute float size;
  attribute float spin;
  attribute float alpha;
  attribute float kind;
  uniform float pixelRatio;
  varying float vSpin;
  varying float vAlpha;
  varying float vKind;
  void main() {
    gl_Position = vec4(position.xy, -0.999, 1.0);
    gl_PointSize = size * pixelRatio;
    vSpin = spin;
    vAlpha = alpha;
    vKind = kind;
  }
`;

// kind 0: a six-armed crystal flake with a soft halo; kind 1: a sparkle.
const fragmentShader = /* glsl */ `
  varying float vSpin;
  varying float vAlpha;
  varying float vKind;
  void main() {
    vec2 c = (gl_PointCoord - 0.5) * 2.0;
    float r = length(c);
    if (r > 1.0) discard;
    float a;
    if (vKind < 0.5) {
      float ang = atan(c.y, c.x) + vSpin;
      float arm = abs(sin(3.0 * ang)) * r;
      float arms = smoothstep(0.09, 0.0, arm) * smoothstep(0.92, 0.7, r);
      float twigs = smoothstep(0.07, 0.0, abs(sin(3.0 * ang + 0.5)) * r)
        * step(0.35, r) * smoothstep(0.65, 0.5, r);
      float core = smoothstep(0.22, 0.0, r);
      float halo = smoothstep(1.0, 0.0, r) * 0.38;
      a = max(max(arms, twigs), max(core, halo));
    } else {
      // A four-pointed glint.
      float cross = smoothstep(0.16, 0.0, min(abs(c.x), abs(c.y))) * (1.0 - r);
      a = max(cross, smoothstep(0.35, 0.0, r));
    }
    // White crystal, its halo a cool icy blue.
    vec3 col = vKind < 0.5
      ? mix(vec3(0.62, 0.82, 1.0), vec3(1.0), smoothstep(0.3, 0.9, a))
      : vec3(1.0);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

type Sparkle = { x: number; y: number; vx: number; vy: number; at: number };

export const Catch = () => {
  const gl = useThree((s) => s.gl);
  const total = FLAKES.count + FLAKES.count * FLAKES.sparkles;
  const { geometry, attrs } = useMemo(() => {
    const g = new BufferGeometry();
    const a = {
      position: new BufferAttribute(new Float32Array(total * 3), 3),
      size: new BufferAttribute(new Float32Array(total), 1),
      spin: new BufferAttribute(new Float32Array(total), 1),
      alpha: new BufferAttribute(new Float32Array(total), 1),
      kind: new BufferAttribute(new Float32Array(total), 1),
    };
    Object.entries(a).forEach(([name, attr]) => g.setAttribute(name, attr));
    for (let i = FLAKES.count; i < total; i += 1) a.kind.setX(i, 1);
    return { geometry: g, attrs: a };
  }, [total]);
  const uniforms = useMemo(() => ({ pixelRatio: { value: 1 } }), []);
  const flakes = useRef<Flake[] | null>(null);
  const sparkles = useRef<Sparkle[]>([]);
  const open = useRef(false);
  const lastStart = useRef(-Infinity);

  useFrame((state, delta) => {
    const t = performance.now() / 1000;
    const dt = Math.min(delta, 0.1);
    const aspect = state.size.width / Math.max(1, state.size.height);
    const half = aspect / 2;
    if (!flakes.current)
      flakes.current = Array.from({ length: FLAKES.count }, () => {
        const f = spawn(half, live.mouth?.x ?? 0);
        // Spread the first ones down the screen, so it doesn't start empty.
        f.y -= Math.random() * 1.1;
        return f;
      });
    const face = live.override ?? live.blendshapes;
    open.current = live.mouth
      ? mouthOpen(open.current, face.jawOpen ?? 0)
      : false;

    let caught = 0;
    // One flake at a time: after one starts flying in, a short gap.
    let ready = t - lastStart.current >= CATCH.gap;
    flakes.current.forEach((before, i) => {
      const r = stepFlake(before, t, dt, live.mouth, open.current && ready);
      if (before.state === "fall" && r.flake.state === "in") {
        lastStart.current = t;
        ready = false;
      }
      const f = r.flake;
      flakes.current![i] = f;
      if (r.caught) {
        caught += 1;
        for (let k = 0; k < FLAKES.sparkles; k += 1) {
          const a = (k / FLAKES.sparkles) * Math.PI * 2 + Math.random() * 0.4;
          const s = FLAKES.burst * (0.6 + Math.random() * 0.8);
          sparkles.current.push({
            x: f.x,
            y: f.y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            at: t,
          });
        }
        flakes.current![i] = spawn(half, live.mouth?.x ?? 0);
      } else if (f.y < -0.6)
        flakes.current![i] = spawn(half, live.mouth?.x ?? 0);
    });
    const next = stepCheeks(
      { fill: live.cheeks, lastCatch: live.lastCatch },
      t,
      dt,
      caught,
      open.current,
    );
    live.cheeks = next.fill;
    live.lastCatch = next.lastCatch;

    // Flakes: a flake flying in shrinks into the mouth.
    flakes.current.forEach((f, i) => {
      const k = f.state === "in" ? Math.min(1, (t - f.at) / CATCH.flyIn) : 0;
      attrs.position.setXYZ(i, f.x / half, f.y * 2, 0);
      attrs.size.setX(i, FLAKES.size * (1 - 0.7 * k));
      attrs.spin.setX(i, t * 0.6 + f.phase);
      attrs.alpha.setX(i, 0.95);
    });
    // Sparkles: fly out and fade.
    sparkles.current = sparkles.current.filter(
      (s) => t - s.at < FLAKES.sparkleLife,
    );
    for (let i = FLAKES.count; i < total; i += 1) {
      const s = sparkles.current[i - FLAKES.count];
      if (!s) {
        attrs.alpha.setX(i, 0);
      } else {
        const age = (t - s.at) / FLAKES.sparkleLife;
        const ease = 1 - (1 - age) ** 3;
        attrs.position.setXYZ(
          i,
          (s.x + s.vx * ease) / half,
          (s.y + s.vy * ease) * 2,
          0,
        );
        attrs.size.setX(i, FLAKES.sparkleSize * (1 - 0.5 * age));
        attrs.alpha.setX(i, 1 - age);
      }
    }
    Object.values(attrs).forEach((a) => {
      // eslint-disable-next-line no-param-reassign
      a.needsUpdate = true;
    });
    uniforms.pixelRatio.value = gl.getPixelRatio();
  });

  return (
    // After the cheeks' warp (998), so the flakes stay sharp.
    <points geometry={geometry} frustumCulled={false} renderOrder={1000}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
};
