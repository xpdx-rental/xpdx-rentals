"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Fragment, type ElementType } from "react";

/**
 * Word-by-word masked reveal, triggered when the heading scrolls into view.
 *
 * ── Why this no longer uses GSAP ────────────────────────────────────────────
 * The previous implementation imported `gsap` + `gsap/ScrollTrigger` — around
 * 70 KB gzipped — to do a staggered translate that `framer-motion`, already in
 * the bundle on every one of these pages, does natively. This component is used
 * on the homepage and most landing pages, so GSAP was a second animation
 * runtime downloaded site-wide for one effect.
 *
 * Three real bugs went with it:
 *
 *  1. **It killed every other component's ScrollTriggers.** Cleanup ran
 *     `ScrollTrigger.getAll().forEach((t) => t.kill())` — not just its own. The
 *     homepage renders six of these, so unmounting any one of them disabled the
 *     scroll animations of all the others.
 *  2. **It destroyed and rebuilt the DOM on mount.** `innerHTML = ""` followed
 *     by hand-built `<span>`s threw away the server-rendered markup and forced
 *     a synchronous layout of the heading on hydration.
 *  3. **Its effect depended on `[children]` but also read `text`** — the prop
 *     every caller on the homepage actually passes. A changed `text` never
 *     re-ran the animation.
 *
 * The markup is now the same on the server and the client, so the heading is
 * real text for a crawler and for a reader with JavaScript disabled. Under
 * `prefers-reduced-motion` the words are simply present, with no transform.
 */

interface SplitTextRevealProps {
  children?: string;
  text?: string;
  className?: string;
  as?: ElementType;
}

type TagProps = { className?: string; children?: React.ReactNode };

const WORD_VARIANTS = {
  hidden: { y: "110%" },
  visible: { y: "0%" },
} as const;

export function SplitTextReveal({
  children,
  text,
  className = "",
  as: Component = "h2",
}: SplitTextRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const content = text ?? children ?? "";
  const words = content.split(" ");

  // Callers pass `as="div"` (where the real <h2> is a visually-hidden sibling)
  // or `as="h2"`. Widened to a plain component type so TypeScript resolves the
  // props of an unknown intrinsic tag rather than intersecting every element's
  // props down to `never`.
  const Tag = Component as React.ComponentType<TagProps>;

  if (shouldReduceMotion) {
    return <Tag className={className}>{content}</Tag>;
  }

  // The outer element stays a plain tag and the motion orchestration lives on
  // an inner `motion.span`. Wrapping the caller's tag with `motion.create()`
  // would mean building a component type during render, which React treats as
  // a brand-new component on every pass — remounting the subtree and resetting
  // the animation each time.
  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        initial="hidden"
        whileInView="visible"
        // `once` avoids re-animating a heading every time it is scrolled past,
        // which reads as a glitch on a long page.
        viewport={{ once: true, margin: "0px 0px -15% 0px" }}
        transition={{ staggerChildren: 0.03 }}
      >
        {words.map((word, i) => (
          <Fragment key={`${word}-${i}`}>
            <span
              // `inline-block` + `overflow-hidden` is the mask the inner span
              // translates out of.
              //
              // The vertical padding/negative-margin pair gives descenders
              // (the y in "Why", the g in "hire with us") room inside the mask.
              // Without it `overflow: hidden` clips them flat against the
              // baseline, which is visible on every heading containing one.
              className="inline-block overflow-hidden pb-[0.12em] mb-[-0.12em] align-bottom"
            >
              <motion.span
                className="inline-block"
                variants={WORD_VARIANTS}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {word}
              </motion.span>
            </span>
            {/*
              A real space between the word spans, rather than the `margin-right`
              this used to rely on. A margin puts a visual gap there but leaves
              no whitespace in the text content, so "Our vans" serialised as
              "Ourvans" — to a copy-paste, to a screen reader reading the
              heading, and to a crawler extracting text. On a site whose whole
              purpose is organic search, headings that read as one run-together
              token are not an acceptable cost for a reveal animation.
            */}
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </motion.span>
    </Tag>
  );
}
