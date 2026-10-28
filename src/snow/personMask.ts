// Things that are always behind you (the bat wings) hide wherever the
// portrait mask says you are: the whole body, not just the head and
// shoulders the depth occluders cover. Grade.tsx keeps the shared mask and
// the drawing size current; a material opts in with hideBehindPerson.
import { Vector2, type Material, type Texture } from "three";

export const personMask = {
  mask: { value: null as Texture | null },
  /** Drawing-buffer size in pixels: gl_FragCoord → screen uv. */
  size: { value: new Vector2(1, 1) },
};

const patched = new WeakSet<Material>();

export const hideBehindPerson = (material: Material) => {
  if (patched.has(material)) return;
  patched.add(material);
  const before = material.onBeforeCompile;
  // eslint-disable-next-line no-param-reassign
  material.onBeforeCompile = (shader, renderer) => {
    before?.call(material, shader, renderer);
    // eslint-disable-next-line no-param-reassign
    shader.uniforms.personMask = personMask.mask;
    // eslint-disable-next-line no-param-reassign
    shader.uniforms.personMaskSize = personMask.size;
    // eslint-disable-next-line no-param-reassign
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        "uniform sampler2D personMask;\nuniform vec2 personMaskSize;\nvoid main() {",
      )
      .replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\n" +
          "if (texture2D(personMask, gl_FragCoord.xy / personMaskSize).g > 0.5) discard;",
      );
  };
  // eslint-disable-next-line no-param-reassign
  material.customProgramCacheKey = () => "behind-person";
  // eslint-disable-next-line no-param-reassign
  material.needsUpdate = true;
};
