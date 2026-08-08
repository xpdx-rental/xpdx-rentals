"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls, Environment } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function VanModel(props: any) {
  // Load the downloaded GLB model
  const { scene } = useGLTF("/models/car.glb");
  const ref = useRef<THREE.Group>(null);

  // Add slow automatic rotation for a professional feel
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={ref} {...props} dispose={null}>
      <primitive object={scene} scale={1.2} />
    </group>
  );
}

export function VanScene() {
  return (
    <div className="w-full h-[300px] lg:h-[450px] relative cursor-move z-10">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [4, 2, 6], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
          <PresentationControls
            global
            snap={true}
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

// Preload the model so it loads instantly when the component mounts
if (typeof window !== "undefined") {
  useGLTF.preload("/models/car.glb");
}
