"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight, Phone, MessageCircle } from "lucide-react";
import { NAV_LINKS } from "@/components/public/nav-links";
import { telHref, waHref } from "@/lib/lead";

/**
 * Mobile menu.
 *
 * Hand-rolled rather than built on `@base-ui/react`'s Sheet. That dialog
 * primitive cost roughly 20KB over the wire on EVERY public page — including
 * desktop, where this component never opens — to provide the only piece of
 * interactive chrome on the site. Against the MOTION.md §10 budget of 190KB
 * initial JS that is a large fraction of the whole allowance for a six-link
 * menu.
 *
 * The accessibility behaviour is kept deliberately, not dropped along with the
 * library: labelled dialog role, focus moved in on open and restored on close,
 * a focus trap, Escape to dismiss, background scroll lock, and 44px targets.
 * This site's audience works outdoors on cracked phones (MOTION.md §11).
 */
export function MobileNav({ phone, whatsapp }: { phone: string | null; whatsapp: string | null }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    // Captured now, not in cleanup: React warns that a ref read during cleanup
    // may already point at a different node.
    const trigger = triggerRef.current;
    // Lock background scroll while the panel is over the page.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel.
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      (previous ?? trigger)?.focus?.();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-lg text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop. Clicking it dismisses, as a dialog should. */}
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col overflow-y-auto border-l border-border bg-background"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="text-lg font-semibold text-foreground">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex size-11 items-center justify-center rounded-lg text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X className="size-6" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex flex-col p-2">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center justify-between rounded-lg px-3 text-base font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {l.label}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
            </nav>

            {phone || whatsapp ? (
              <div className="mt-auto space-y-2 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {phone ? (
                  <a
                    href={telHref(phone)}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
                  >
                    <Phone className="size-5" aria-hidden="true" /> Call {phone}
                  </a>
                ) : null}
                {whatsapp ? (
                  <a
                    href={waHref(whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border px-4 font-semibold text-foreground"
                  >
                    <MessageCircle className="size-5" aria-hidden="true" /> WhatsApp
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
