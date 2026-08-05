import Link from "next/link";
import { ContactLink } from "@/components/public/contact-link";
import { Phone } from "lucide-react";
import { getSiteContact } from "@/lib/data/settings";
import { MobileNav } from "@/components/public/mobile-nav";
import { NAV_LINKS } from "@/components/public/nav-links";
import { telHref } from "@/lib/lead";

/**
 * Public header.
 *
 * No login link, no account, no hint that a staff portal exists — CLAUDE.md
 * §7 and the §12 done-criteria. The phone number is the most valuable control
 * here, so it is visible from `sm` up and duplicated in the sticky bar below
 * 700px.
 */


export async function SiteNav() {
  const contact = await getSiteContact();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-ink/40 backdrop-blur-xl shadow-lg transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Link
          href="/"
          className="font-heading text-xl font-extrabold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          {/* Logo asset is sourced from the client in Phase 7 (REBRAND.md §5). */}
          XPDX <span className="font-medium text-muted-foreground">Rentals</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[15px] font-medium text-body transition-colors hover:text-link focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {contact.phone ? (
            <ContactLink
              href={telHref(contact.phone)}
              channel="call"
              className="hidden min-h-11 items-center gap-2 rounded-lg px-3 text-[15px] font-semibold text-foreground transition-colors hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"
            >
              <Phone className="size-4 text-link" aria-hidden="true" />
              {contact.phone}
            </ContactLink>
          ) : null}
          <Link
            href="/contact-us"
            className="hidden min-h-11 items-center rounded-lg bg-primary px-5 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"
          >
            Get a quote
          </Link>
          <MobileNav phone={contact.phone} whatsapp={contact.whatsapp} />
        </div>
      </div>
    </header>
  );
}
