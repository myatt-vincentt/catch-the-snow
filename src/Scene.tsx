// Scene.tsx — Catch the Snow: snow falls in your room; open your mouth to
// catch the flakes and your cheeks fill up with snow, then slowly melt back.
// Santa hat and reindeer nose. See PLAN.md.
import { lazy, Suspense } from "react";

import { SnowScene } from "./snow/SnowScene";

// Dev-only helpers for previewing without a camera. Lazy and behind a
// constant esbuild folds to false in production. Two rules:
// `process.env.NODE_ENV`, not `import.meta.env.DEV` (vincentt-xr/v2-template#112);
// and write the check INSIDE the ternary — hoisted into a `const`, esbuild
// keeps the dead branch.
const DevMediaSwitcher =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./DevMediaSwitcher"))
    : null;
const DevKeys =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./snow/DevKeys"))
    : null;

export const Scene = () => (
  <>
    <SnowScene />
    {DevMediaSwitcher && DevKeys ? (
      <Suspense fallback={null}>
        <DevMediaSwitcher />
        <DevKeys />
      </Suspense>
    ) : null}
  </>
);
