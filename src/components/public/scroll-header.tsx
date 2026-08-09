"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", update);
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Smoothly blend the background from transparent to the creamish state
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(253, 247, 230, 0)", "rgba(232, 215, 184, 0.9)"] // A cooler, darker cream shade
  );
  
  const borderColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(0, 0, 0, 0)", "rgba(219, 195, 158, 0.4)"] // Matches --border-subtle
  );

  return (
    <motion.header
      style={{ backgroundColor, borderColor, borderBottomWidth: "1px" }}
      className={`sticky top-0 z-40 w-full transition-shadow duration-500 ${
        isScrolled ? "backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]" : ""
      }`}
    >
      {children}
    </motion.header>
  );
}
