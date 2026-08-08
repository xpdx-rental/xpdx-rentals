"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

/**
 * The interactive 3D van.
 *
 * ── Why this file is never imported statically ──────────────────────────────
 * `three` + `@react-three/fiber` + `@react-three/drei` are roughly half a
 * megabyte of gzipped JavaScript, and the model this scene loads
 * (`/models/car.glb`) is **20.5 MB**. Until this was fixed the import chain ran
 *
 *     artistic-hero.tsx (client, rendered on the homepage)
 *       → van-360-viewer.tsx
 *         → van-scene.tsx
 *
 * all statically — so the three.js runtime shipped in the homepage's first-load
 * bundle, and a module-scope `useGLTF.preload("/models/car.glb")` at the bottom
 * of this file started downloading the 20.5 MB model the moment the homepage
 * hydrated. Every visitor paid for it; almost none of them ever opened the
 * viewer.
 *
 * The viewer is now reached only through `next/dynamic` in `van-360-viewer.tsx`,
 * and the preload is triggered explicitly by `preloadVanModel()` on deliberate
 * intent (pointer-over / focus of the "360" button) rather than at import time.
 *
 * Do not add a top-level `useGLTF.preload` back to this module.
 */

function VanModel() {
  const { scene } = useGLTF("/models/car.glb");
  const ref = useRef<THREE.Group>(null);

  // Slow automatic rotation. `delta` rather than a fixed step so the speed is
  // frame-rate independent — the same rotation on a 60 Hz phone and a 144 Hz
  // desktop.
  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={ref} dispose={null}>
      <primitive object={scene} scale={1.2} />
    </group>
  );
}

export function VanScene() {
  return (
    <div className="w-full h-[300px] lg:h-[450px] relative cursor-move z-10">
      <Canvas
        shadows
        // Capped at 1.5 rather than 2. On a 3x phone this is the difference
        // between rendering ~2.1x and ~9x the CSS pixel count every frame, and
        // the model is a smooth-shaded vehicle body where the extra density is
        // not visible. `frameloop="demand"` is not usable here because the
        // model auto-rotates.
        dpr={[1, 1.5]}
        camera={{ position: [4, 2, 6], fov: 45 }}
        // Release the WebGL context and its GPU memory as soon as the modal
        // unmounts. Without this the browser keeps the context alive and hits
        // its per-page context limit after a few open/close cycles.
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
          <PresentationControls
            global
            snap
            rotation={[0.1, 0.5, 0]}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Math.PI / 1.4, Math.PI / 2]}
          >
            <Stage environment={null} intensity={0.5} castShadow={false}>
              <VanModel />
            </Stage>
          </PresentationControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
