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
            <div key={l.label} className="relative group">
              <Link
                href={l.href}
                className="flex items-center gap-1 relative text-[13px] uppercase tracking-widest font-bold text-foreground/70 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:text-foreground hover:after:w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary py-2"
              >
                {l.label}
                {l.subLinks && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down opacity-50 group-hover:rotate-180 transition-transform"><path d="m6 9 6 6 6-6"/></svg>
                )}
              </Link>
              
              {l.subLinks && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="w-56 rounded-xl border border-border bg-background shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden py-1">
                    {l.subLinks.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="block px-4 py-3 text-sm font-semibold text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {contact.phone ? (
            <ContactLink
              href={telHref(contact.phone)}
              channel="call"
              className="hidden min-h-11 items-center gap-2 rounded-full px-4 text-[13px] font-bold text-foreground transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"
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
