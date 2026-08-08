"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useRef } from "react";

/**
 * A button/link that leans subtly toward the cursor on hover — one of the
 * few "expensive-feeling" motion touches used site-wide, so it lives in one
 * place instead of being copy-pasted per section. Disabled under
 * prefers-reduced-motion: the element still works, it just doesn't chase
 * the pointer.
 */
export function MagneticButton({
  children,
  className,
  href,
  onClick,
  strength = 0.15,
  target,
  rel,
  "aria-label": ariaLabel,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  className: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  strength?: number;
  target?: string;
  rel?: string;
  "aria-label"?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 200, damping: 20, mass: 0.5 });

  const handleMouse = (e: React.MouseEvent) => {
    if (shouldReduceMotion) return;
    const rect = ref.current!.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={shouldReduceMotion ? undefined : { x: springX, y: springY }}
    >
      {href ? (
        <Link href={href} className={className} onClick={onClick} target={target} rel={rel} aria-label={ariaLabel}>
          {children}
        </Link>
      ) : (
        <button type={type} disabled={disabled} className={className} onClick={onClick} aria-label={ariaLabel}>
          {children}
        </button>
      )}
    </motion.div>
  );
}
