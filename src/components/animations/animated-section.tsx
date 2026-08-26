"use client";

import { m, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  once = true,
}: AnimatedSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-10%" }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Custom easing for smooth, premium feel
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
