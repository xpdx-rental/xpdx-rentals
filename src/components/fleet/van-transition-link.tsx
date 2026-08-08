"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Shared-element van transition — MOTION.md §4.3.
 *
 * Uses the **native** View Transitions API directly, as §4.3 specifies:
 * "Browsers without support get an ordinary navigation. No polyfill, no
 * fallback library."
 *
 * Note on the implementation choice: Next's own guide reaches for React's
 * `<ViewTransition>` component, but that only exists on React's *experimental*
 * channel — `react@19.2.4` does not export it at runtime. Switching this
 * project onto an experimental React release for a page transition is not a
 * trade worth making mid-conversion, and the native API is what MOTION.md asked
 * for anyway. It is roughly thirty lines and no dependency.
 *
 * The morph itself is declared in CSS via `view-transition-name`, set on the
 * card and detail elements. This component only starts the transition so the
 * browser has an old and a new state to interpolate between.
 */

type StartViewTransition = (cb: () => void) => { finished: Promise<void> };

export function VanTransitionLink({
  href,
  children,
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "children" | "className">) {
  const router = useRouter();

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle modified clicks (new tab, download, etc).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const doc = document as Document & { startViewTransition?: StartViewTransition };
    if (typeof doc.startViewTransition !== "function") return; // ordinary navigation

    // Respect reduced motion: the transition is skipped, the navigation is not.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    e.preventDefault();
    doc.startViewTransition(() => {
      router.push(href);
    });
  }

  return (
    <Link href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}


