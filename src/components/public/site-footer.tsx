import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { getSiteContact, getOpeningHours } from "@/lib/data/settings";
import { telHref } from "@/lib/lead";
import { BRAND, SOCIALS, HIRE_TERMS } from "@/lib/business";

const FLEET_LINKS = [
  { href: "/vans", label: "Our fleet" },
  { href: "/local-van-hire", label: "Local van hire" },
  { href: "/delivery-van-for-rent", label: "Delivery van hire" },
  { href: "/business-van-rental", label: "Business van rental" },
  { href: "/service-area", label: "Service area" },
];

const COMPANY_LINKS = [
  { href: "/about-us", label: "About us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact-us", label: "Contact us" },
  { href: "/terms-of-hire", label: "Terms of hire" },
  { href: "/privacy-policy", label: "Privacy policy" },
];

const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/**
 * Public footer.
 *
 * Carries the NAP block, which must stay byte-identical to the Google Business
 * Profile for local SEO — so the address comes from settings, not from JSX.
 *
 * No staff-portal link, per CLAUDE.md §7 and the §12 done-criteria.
 */
export async function SiteFooter() {
  const [contact, hours] = await Promise.all([getSiteContact(), getOpeningHours()]);
  const year = new Date().getFullYear();
  const hasHours = Object.keys(hours).length > 0;

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-heading text-xl font-extrabold tracking-tight text-foreground">
              XPDX <span className="font-medium text-muted-foreground">Rentals</span>
            </p>
            <p className="mt-1 text-sm font-medium text-link">{BRAND.tagline}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Long-term cargo van hire from our yard at {contact.address.split(",")[1]?.trim() ?? "Condell Park"}.
              {" "}
              {HIRE_TERMS.minHireDays} day minimum hire.
            </p>

            <ul className="mt-4 text-sm sm:space-y-2">
              {contact.phone ? (
                <li>
                  <a
                    href={telHref(contact.phone)}
                    className="inline-flex min-h-11 items-center gap-2 text-body hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-0"
                  >
                    <Phone className="size-4 text-link" aria-hidden="true" />
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex min-h-11 items-center gap-2 break-all text-body hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-0"
                  >
                    <Mail className="size-4 text-link" aria-hidden="true" />
                    {contact.email}
                  </a>
                </li>
              ) : null}
              <li className="flex items-start gap-2 text-body">
                <MapPin className="mt-0.5 size-4 shrink-0 text-link" aria-hidden="true" />
                <address className="not-italic">{contact.address}</address>
              </li>
            </ul>
          </div>

          <nav aria-labelledby="footer-fleet">
            <h2 id="footer-fleet" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Hire
            </h2>
            <ul className="mt-4 text-sm sm:space-y-2.5">
              {FLEET_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-11 items-center text-body hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-0"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-company">
            <h2 id="footer-company" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Company
            </h2>
            <ul className="mt-4 text-sm sm:space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-11 items-center text-body hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-0"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" /> Opening hours
            </h2>
            {hasHours ? (
              <ul className="mt-4 space-y-1.5 text-sm">
                {DAY_ORDER.filter((d) => hours[d]).map((d) => (
                  <li key={d} className="grid grid-cols-[3rem_1fr] gap-3">
                    <span className="text-muted-foreground">{DAY_LABELS[d]}</span>
                    <span className="whitespace-nowrap text-body">{hours[d]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              // TODO(client): opening hours. CLAUDE.md §3 lists these as not
              // supplied; a guessed closing time on a yard customers drive to
              // is worse than none.
              <p className="mt-4 text-sm text-muted-foreground">
                Please call to confirm our opening hours.
              </p>
            )}

            <div className="mt-5 flex gap-5 sm:gap-3">
              <a
                href={SOCIALS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm text-body hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-0"
              >
                Instagram
              </a>
              <a
                href={SOCIALS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm text-body hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-0"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>
            © {year} {contact.legalName ?? contact.tradingName}. All rights reserved.
          </span>
          {contact.abn ? <span>ABN {contact.abn}</span> : null}
        </div>
      </div>
    </footer>
  );
}
