import { Phone, MessageCircle } from "lucide-react";
import { ContactLink } from "@/components/public/contact-link";
import { getSiteContact } from "@/lib/data/settings";
import { telHref, waHref } from "@/lib/lead";

/**
 * Sticky call / WhatsApp bar under 700px — CLAUDE.md §8, every page.
 *
 * Hidden at `min-width: 700px` via a media query rather than a Tailwind
 * breakpoint, because §8 names that exact width and Tailwind's `md` is 768px.
 *
 * Server-rendered with no JavaScript: this is the highest-value control on the
 * site for a tradie checking prices one-handed, so it must be present in the
 * first paint and must not depend on hydration. It also carries
 * `env(safe-area-inset-bottom)` so it clears the iOS home indicator.
 */
export async function StickyContactBar() {
  const contact = await getSiteContact();
  if (!contact.phone && !contact.whatsapp) return null;

  return (
    <>
      <div
        className="sticky-contact-bar fixed inset-x-0 bottom-0 z-50 grid grid-flow-col border-t border-border bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {contact.phone ? (
          <ContactLink
            href={telHref(contact.phone)}
            channel="call"
            className="flex min-h-14 items-center justify-center gap-2 bg-primary font-bold text-primary-foreground"
          >
            <Phone className="size-5" aria-hidden="true" />
            Call now
          </ContactLink>
        ) : null}
        {contact.whatsapp ? (
          <ContactLink
            href={waHref(contact.whatsapp)}
            channel="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-14 items-center justify-center gap-2 font-bold text-foreground"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            WhatsApp
          </ContactLink>
        ) : null}
      </div>
      {/* Spacer so the bar never covers the last element of the page. */}
      <div className="sticky-contact-bar-spacer h-14" aria-hidden="true" />
    </>
  );
}
