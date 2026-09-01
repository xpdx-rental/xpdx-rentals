import type { Metadata } from "next";
import { Globe2, Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { optionalEnv } from "@/lib/config";
import { DEFAULT_ALLOWED_COUNTRIES } from "@/lib/security/geo-restriction";
import { cn } from "@/lib/utils";

/**
 * Geo-restriction landing page.
 *
 * `src/proxy.ts` REWRITES (not redirects) requests from outside the served
 * regions here, so the visitor keeps the URL they asked for and there is no
 * extra round-trip. The page fetches no data, so rendering it is a pure React
 * render — a blocked request never touches Supabase.
 *
 * SEO: explicitly `noindex, nofollow`. The proxy also sets `X-Robots-Tag` and
 * `Cache-Control: no-store` on the blocked response, and `robots.ts` disallows
 * `/geo-blocked`, so this page can never displace a real page in the index for
 * the target market.
 */

/**
 * A geo-blocked reply is served under the URL the visitor originally requested
 * (e.g. `/vans`). Forcing it dynamic makes Next emit `no-store` itself, so
 * a shared cache can never store this country-specific response against a
 * normal page's cache key and later serve it to an Australian customer. The page
 * does no I/O, so "dynamic" here costs only a render.
 */
export const dynamic = "force-dynamic";

/** Fallback matches the support address used by src/lib/email/ses.ts. */
const CONTACT_EMAIL = optionalEnv("CONTACT_EMAIL_TO") ?? null;

/** Same number the sticky contact bar and LocalBusiness JSON-LD advertise. */
// Phase 4: removed the other client's real WhatsApp number (REBRAND.md §3.2).
const WHATSAPP_NUMBER = optionalEnv("NEXT_PUBLIC_WHATSAPP_NUMBER") ?? null;

/** ISO codes → display names, so page copy and policy can never drift apart. */
const COUNTRY_NAMES: Record<string, string> = {
  AU: "Australia",
  IN: "India",
};

function servedRegions(): string {
  const names = DEFAULT_ALLOWED_COUNTRIES.map((code) => COUNTRY_NAMES[code] ?? code);
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
    : names[0];
}

export const metadata: Metadata = {
  title: "Not available in your region",
  description:
    "XPDX Rentals hires vans in Sydney, Australia. Our site is only available in the regions we serve.",
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
  // Clears the root layout's `canonical: "/"` — this page must never claim to
  // be the canonical version of the homepage.
  alternates: {},
};

export default function GeoBlockedPage() {
  const regions = servedRegions();
  const enquirySubject = encodeURIComponent("XPDX Rentals — enquiry from outside Australia");
  const enquiryBody = encodeURIComponent(
    "Hi XPDX Rentals,\n\nI'm contacting you from outside Australia.\n\nName:\nCountry:\n",
  );

  return (
    <main className="dark bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <BrandLogo priority className="h-[48px] w-[180px] sm:h-[56px] sm:w-[220px]" />

      <div
        className="mt-10 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
        aria-hidden="true"
      >
        <Globe2 className="size-8 text-primary" />
      </div>

      <h1 className="mt-8 max-w-2xl text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        This site is available only in {regions}.
      </h1>

      <p className="mt-4 max-w-lg text-base text-muted-foreground">
        We hire vans from our yard in Sydney, so the site is limited to the regions
        we can actually serve. If you believe you&apos;re seeing this by mistake —
        for example while using a VPN — turn it off and reload the page.
      </p>

      {/* Contact links only. Both are mailto/WhatsApp by design: the API surface
          stays fully closed to blocked regions, so there is nothing here for an
          out-of-region client to submit against. Each renders only when its
          detail is configured — a `mailto:null` is worse than no button. */}
      {CONTACT_EMAIL || WHATSAPP_NUMBER ? (
        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          {CONTACT_EMAIL ? (
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${enquirySubject}&body=${enquiryBody}`}
              className={cn(buttonVariants({ variant: "default", size: "cta" }), "gap-2")}
            >
              <Mail className="size-4" />
              Email us
            </a>
          ) : null}
          {WHATSAPP_NUMBER ? (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "cta" }), "gap-2")}
            >
              <WhatsAppIcon className="size-4" />
              Chat on WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}

      {CONTACT_EMAIL ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Questions?{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-link underline-offset-4 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      ) : null}

      <p className="mt-12 text-xs text-muted-foreground">
        XPDX Rentals — van hire in Sydney.
      </p>
    </main>
  );
}
