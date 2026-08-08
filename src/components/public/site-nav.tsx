import Link from "next/link";
import { ContactLink } from "@/components/public/contact-link";
import { Phone } from "lucide-react";
import { getSiteContact } from "@/lib/data/settings";
import { MobileNav } from "@/components/public/mobile-nav";
import { NAV_LINKS } from "@/components/public/nav-links";
import { telHref } from "@/lib/lead";
import { BrandLogo } from "@/components/brand-logo";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { ScrollHeader } from "@/components/public/scroll-header";

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
    <ScrollHeader>
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-4 px-6 lg:px-12">
        <Link
          href="/"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary transition-transform hover:scale-105"
        >
          <BrandLogo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative text-[13px] uppercase tracking-widest font-bold text-white/60 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:text-white hover:after:w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
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
              className="hidden min-h-11 items-center gap-2 rounded-full px-4 text-[13px] font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"
            >
              <Phone className="size-4 text-primary" aria-hidden="true" />
              {contact.phone}
            </ContactLink>
          ) : null}
          <MagneticButton
            href="/contact-us"
            strength={0.25}
            className="hidden min-h-11 items-center rounded-full bg-primary px-6 text-[13px] font-bold text-primary-foreground transition-shadow duration-300 hover:shadow-[0_0_28px_rgba(201,171,129,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex shadow-[0_0_20px_rgba(201,171,129,0.3)]"
          >
            Get a quote
          </MagneticButton>
          <MobileNav phone={contact.phone} whatsapp={contact.whatsapp} />
        </div>
      </div>
    </ScrollHeader>
  );
}
