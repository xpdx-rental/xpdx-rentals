"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCw, Loader2 } from "lucide-react";

/**
 * Modal wrapper for the interactive 3D van.
 *
 * The scene is code-split behind `next/dynamic` with `ssr: false`. That one
 * change is the largest single performance fix on the site: `van-scene.tsx`
 * pulls in three.js, @react-three/fiber and @react-three/drei, and it used to
 * be a static import from `artistic-hero.tsx` — a client component rendered on
 * the homepage. So the whole three.js runtime sat in the homepage's first-load
 * JS, and the scene module's top-level `useGLTF.preload("/models/car.glb")`
 * fired on hydration and pulled down a **20.5 MB** model before the visitor had
 * touched anything.
 *
 * Now nothing 3D is fetched until the visitor actually asks for it. The button
 * that opens this modal calls `preloadVanScene()` on hover/focus, so for anyone
 * who does intend to open it the chunk is usually already in flight by the time
 * they click.
 */
const VanScene = dynamic(
  () => import("@/components/animations/van-scene").then((m) => m.VanScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/50">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.2em]">Loading 3D view</p>
        </div>
      </div>
    ),
  },
);

/**
 * Warms the 3D chunk on deliberate intent (pointer-over / focus of the trigger)
 * rather than on page load. Safe to call repeatedly — the dynamic import is
 * memoised by the module system, so subsequent calls are free.
 */
export function preloadVanScene() {
  void import("@/components/animations/van-scene");
}

export function Van360Viewer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Lock background scroll while open, and restore whatever the page had
  // before rather than assuming it was "" — the sticky contact bar and the
  // mobile nav both touch this property.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Escape closes. A full-screen overlay with only a mouse-reachable close
  // button is a keyboard trap.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Interactive 360 degree van view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-xl touch-none"
        >
          <button
            onClick={onClose}
            aria-label="Close 360 view"
            autoFocus
            className="absolute top-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <div className="relative w-full h-[100vh] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 2.5, duration: 1 }}
              className="absolute top-[20%] left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-full bg-black/50 border border-white/10 text-white pointer-events-none z-20"
            >
              <RotateCw className="size-4 animate-[spin_3s_linear_infinite]" aria-hidden="true" />
              <span className="text-sm font-bold tracking-wide uppercase">Drag to Rotate</span>
            </motion.div>

            <div className="relative w-full max-w-6xl h-[80vh] cursor-grab active:cursor-grabbing">
              <VanScene />
            </div>

            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[100px] bg-white/[0.03] blur-[40px] rounded-[100%] pointer-events-none" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
