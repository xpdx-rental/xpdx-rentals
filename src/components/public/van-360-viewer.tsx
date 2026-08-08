"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCw } from "lucide-react";
import { VanScene } from "@/components/animations/van-scene";

export function Van360Viewer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-xl touch-none"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>

          {/* Viewer Container */}
          <div className="relative w-full h-[100vh] flex items-center justify-center">
            {/* Instruction Overlay */}
            <motion.div 
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 2.5, duration: 1 }}
              className="absolute top-[20%] left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-full bg-black/50 border border-white/10 text-white pointer-events-none z-20"
            >
              <RotateCw className="size-4 animate-[spin_3s_linear_infinite]" />
              <span className="text-sm font-bold tracking-wide uppercase">Drag to Rotate</span>
            </motion.div>

            {/* The 3D Scene */}
            <div className="relative w-full max-w-6xl h-[80vh] cursor-grab active:cursor-grabbing">
              <VanScene />
            </div>
            
            {/* Floor reflection (cinematic touch) */}
            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[100px] bg-white/[0.03] blur-[40px] rounded-[100%] pointer-events-none" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
