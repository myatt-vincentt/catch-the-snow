// Dev only: O holds the mouth open (or lets it go), C stuffs the cheeks a
// step fuller (round to empty), 0 empties them, 9 fills them; window.__snow
// exposes the live readings for debugging.
// Scene.tsx lazy-imports this behind an inline NODE_ENV check, so it never
// reaches production.
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { live } from "./live";

const DevKeys = () => {
  const scene = useThree((st) => st.scene);
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__snow = { live, scene };
    const onKey = (e: KeyboardEvent) => {
      // A dev change counts as a catch, so the cheeks hold before melting.
      live.lastCatch = performance.now() / 1000;
      if (e.key === "o") live.override = live.override ? null : { jawOpen: 1 };
      else if (e.key === "c")
        live.cheeks = live.cheeks >= 1 ? 0 : Math.min(1, live.cheeks + 0.25);
      else if (e.key === "0") live.cheeks = 0;
      else if (e.key === "9") live.cheeks = 1;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene]);
  return null;
};

export default DevKeys;
