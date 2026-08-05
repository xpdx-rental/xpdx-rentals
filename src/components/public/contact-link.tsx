"use client";

import type { ReactNode } from "react";

/**
 * A `tel:` or `wa.me` link that records the click as a conversion.
 *
 * CLAUDE.md §9: "`tel:` and `wa.me` clicks are conversions too. Track them."
 * On a site whose audience is tradies checking prices one-handed, the phone is
 * at least as important a conversion path as the form — counting only form
 * submissions would badly understate what the site is doing.
 *
 * Deliberately tiny. It uses `sendBeacon`, which survives the page being torn
 * down by the dialler or WhatsApp opening, and falls back to a `keepalive`
 * fetch. Nothing is awaited and nothing can block or prevent the navigation:
 * if tracking fails, the customer still calls, which is the only outcome that
 * actually matters.
 */
export function ContactLink({
  href,
  channel,
  vanId,
  children,
  className,
  ...rest
}: {
  href: string;
  channel: "call" | "whatsapp" | "enquire";
  vanId?: string | null;
  children: ReactNode;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  function track() {
    try {
      const payload = JSON.stringify({
        vanId: vanId ?? undefined,
        channel,
        pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
      });

      // Conversion event for GTM, guarded so a missing dataLayer is harmless.
      (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({
        event: "contact_click",
        channel,
        van: vanId ?? null,
      });

      const blob = new Blob([payload], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/v1/cta-clicks", blob)) {
        void fetch("/api/v1/cta-clicks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Never let analytics interfere with a customer trying to call.
    }
  }

  return (
    <a href={href} className={className} onClick={track} {...rest}>
      {children}
    </a>
  );
}
