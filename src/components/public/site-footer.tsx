import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { getSiteContact, getOpeningHours } from "@/lib/data/settings";
import { telHref } from "@/lib/lead";
import { BRAND, SOCIALS, HIRE_TERMS } from "@/lib/business";
import { allLocationLinks } from "@/lib/seo/links";
import { IframeMap } from "@/components/public/iframe-map";

const FLEET_LINKS = [
  { href: "/van-hire", label: "Van hire" },
  { href: "/vans", label: "Our fleet" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/local-van-hire", label: "Local van hire" },
  { href: "/delivery-van-for-rent", label: "Delivery van hire" },
  { href: "/business-van-rental", label: "Business van rental" },
  { href: "/service-area", label: "Service area" },
];

const COMPANY_LINKS = [
  { href: "/about-us", label: "About us" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
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
  // Suburb links come from the SEO registry rather than a hardcoded list, so
  // the footer can never advertise a page the quality gate declined to
  // generate. That was a real bug in the previous footer: it linked all ten
  // `/locations/*` URLs unconditionally.
  const [contact, hours, locationLinks] = await Promise.all([
    getSiteContact(),
    getOpeningHours(),
    allLocationLinks(10),
  ]);
  const year = new Date().getFullYear();
  const hasHours = Object.keys(hours).length > 0;

  return (
    <footer className="relative overflow-hidden border-t border-border bg-muted/30 pt-16 pb-8 mt-auto">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-4 mb-12">
          
          {/* Column 1: Brand & Contact */}
          <div className="space-y-6">
            <div>
              <p className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
                XPDX <span className="font-medium text-primary">Rentals</span>
              </p>
              <p className="mt-2 text-sm font-medium text-link">{BRAND.tagline}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex size-1.5 rounded-full bg-primary"></span>
                </span>
                Operating 100+ Commercial Vehicles
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Premium cargo van hire from our yard at {contact.address.split(",")[1]?.trim() ?? "Condell Park"}.
                {" "}
                {HIRE_TERMS.minHireDays} day minimum hire for trades and businesses.
              </p>
            </div>

            <ul className="text-sm space-y-3">
              {contact.phone ? (
                <li>
                  <a href={telHref(contact.phone)} className="inline-flex items-center gap-3 text-body hover:text-primary transition-colors">
                    <Phone className="size-4 text-primary" aria-hidden="true" />
                    <span className="font-medium">{contact.phone}</span>
                  </a>
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-3 break-all text-body hover:text-primary transition-colors">
                    <Mail className="size-4 text-primary" aria-hidden="true" />
                    {contact.email}
                  </a>
                </li>
              ) : null}
              <li className="flex items-start gap-3 text-body">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <address className="not-italic">{contact.address}</address>
              </li>
            </ul>

            <div className="flex gap-4 pt-2">
              <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6">
              Quick Links
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <ul className="space-y-3 text-sm">
                <li className="font-semibold text-muted-foreground mb-1">Hire</li>
                {FLEET_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-body hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3 text-sm">
                <li className="font-semibold text-muted-foreground mb-1">Company</li>
                {COMPANY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-body hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Areas & Hours */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6">
              Service Areas
            </h2>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-sm mb-8">
              {locationLinks.map((loc) => (
                <li key={loc.href}>
                  <Link href={loc.href} className="text-body hover:text-primary transition-colors block truncate pr-2">
                    {loc.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground mb-4">
              <Clock className="size-4 text-primary" aria-hidden="true" /> Opening hours
            </h2>
            <ul className="space-y-2 text-sm">
              {hasHours ? (
                DAY_ORDER.filter((d) => hours[d]).map((d) => (
                  <li key={d} className="flex justify-between border-b border-border/40 pb-1 last:border-0">
                    <span className="text-muted-foreground">{DAY_LABELS[d]}</span>
                    <span className="font-medium text-body">{hours[d]}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex justify-between border-b border-border/40 pb-1">
                    <span className="text-muted-foreground">Mon - Fri</span>
                    <span className="font-medium text-body">9:00 AM - 5:00 PM</span>
                  </li>
                  <li className="flex justify-between border-b border-border/40 pb-1">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-medium text-body">9:00 AM - 1:00 PM</span>
                  </li>
                  <li className="flex justify-between border-b border-border/40 pb-1">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium text-body">Closed</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 4: Location Map */}
          <div className="flex flex-col h-full min-h-[250px]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6">
              Our Location
            </h2>
            <div className="flex-grow rounded-xl overflow-hidden border border-border shadow-sm relative">
              <IframeMap address={contact.address} className="w-full h-full min-h-[200px]" />
            </div>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Get Directions &rarr;
            </a>
          </div>

        </div>

        <div className="flex flex-col md:flex-row items-center justify-between border-t border-border/50 pt-8 pb-4 text-sm text-muted-foreground">
          <p>
            © {year} {contact.legalName ?? contact.tradingName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {contact.abn ? <span>ABN {contact.abn}</span> : null}
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms-of-hire" className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
