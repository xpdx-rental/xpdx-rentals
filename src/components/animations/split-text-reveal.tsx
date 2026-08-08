"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextRevealProps {
  children?: string;
  text?: string;
  className?: string;
  as?: any;
}

export function SplitTextReveal({ children, text, className = "", as: Component = "h2" }: SplitTextRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const content = text || children;
    if (!content) return;

    // We manually split the text into words and wrap them in spans for GSAP to animate.
    // This gives us SplitText-like control without worrying about exact import paths.
    const words = content.split(" ");
    
    // Clear and rebuild DOM for the split
    containerRef.current.innerHTML = "";
    words.forEach((word, i) => {
      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-block";
      wordSpan.style.overflow = "hidden"; // Mask for the reveal
      wordSpan.style.marginRight = "0.25em";
      
      const innerSpan = document.createElement("span");
      innerSpan.style.display = "inline-block";
      innerSpan.style.transform = "translateY(110%)"; // Start position (hidden below mask)
      innerSpan.innerText = word;
      
      wordSpan.appendChild(innerSpan);
      containerRef.current!.appendChild(wordSpan);
    });

    const innerSpans = containerRef.current.querySelectorAll("span > span");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(innerSpans, {
      y: "0%",
      duration: 0.8,
      stagger: 0.03,
      ease: "power4.out",
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [children]);

  return (
    <Component
      ref={containerRef}
      className={className}
      // Provide fallback text for SSR, the useEffect will replace it on client mount
    >
      {text || children}
    </Component>
  );
}
