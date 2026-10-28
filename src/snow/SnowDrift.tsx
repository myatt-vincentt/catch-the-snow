// A snowdrift along the bottom of the screen, in front of you: a soft,
// lumpy bank of snow with blue shade in its hollows, a bright rim along the
// top and glints twinkling in it. One quad in screen space; the far flakes
// fall behind it, the near ones in front.
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";

const DRIFT = {
  /** Height of the bank (screen heights from the bottom), and its lumps. */
  height: 0.13,
  lumps: 0.035,
};

// The quad covers the bottom of the screen up to the highest lump: `span`
// screen heights. vUv.y is in screen heights from the bottom.
const vertexShader = /* glsl */ `
  uniform float span;
  varying vec2 vUv;
  void main() {
    vUv = vec2(uv.x, uv.y * span);
    gl_Position = vec4(position.x, -1.0 + uv.y * span * 2.0, -0.99, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float time;
  uniform float aspect;
  uniform float height;
  uniform float lumps;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash(vec2(i, 0.0)), hash(vec2(i + 1.0, 0.0)), u);
  }

  void main() {
    // x in screen heights; y in screen heights from the bottom.
    float x = vUv.x * aspect;
    float y = vUv.y;
    float top = height
      + lumps * (noise(x * 5.0) * 0.7 + noise(x * 13.0 + 7.0) * 0.3 - 0.5) * 2.0;
    float d = top - y;
    float a = smoothstep(-0.004, 0.006, d);
    if (a <= 0.0) discard;
    // Shade: bright at the rim, cool blue lower down and in the hollows.
    float depth = clamp(d / height, 0.0, 1.0);
    vec3 snow = mix(vec3(1.0), vec3(0.78, 0.86, 1.0), smoothstep(0.0, 0.9, depth));
    snow = mix(snow, vec3(0.7, 0.8, 0.98), (1.0 - noise(x * 9.0 + 3.0)) * 0.18 * depth);
    snow += vec3(0.08) * smoothstep(0.03, 0.0, d);
    // Glints: a few cells hold a small round twinkle each.
    vec2 g = vec2(x, y) * 70.0;
    vec2 cell = floor(g);
    float h = hash(cell);
    float spot = smoothstep(0.32, 0.0, length(fract(g) - 0.5));
    float tw = step(0.975, h) * spot
      * (0.5 + 0.5 * sin(time * (2.0 + h * 5.0) + h * 40.0));
    snow += vec3(tw);
    gl_FragColor = vec4(snow, a);
  }
`;

export const SnowDrift = () => {
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      aspect: { value: 9 / 16 },
      height: { value: DRIFT.height },
      lumps: { value: DRIFT.lumps },
      span: { value: DRIFT.height + DRIFT.lumps * 2 },
    }),
    [],
  );
  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime;
    uniforms.aspect.value = state.size.width / Math.max(1, state.size.height);
  });
  return (
    <mesh frustumCulled={false} renderOrder={990}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
};
