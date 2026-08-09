"use client";

import { useState } from "react";
import { Box } from "lucide-react";
import { Van360Viewer, preloadVanScene } from "./van-360-viewer";

export function Van360Button() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        onMouseEnter={preloadVanScene}
        onFocus={preloadVanScene}
        className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/80 hover:scale-105 transition-all"
      >
        <Box className="size-4" />
        View in 3D
      </button>

      <Van360Viewer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
