import { siteBaseUrl, absoluteUrl } from "@/lib/seo/site";
import { ADDRESS, BRAND, SOCIALS } from "@/lib/business";
import type { Faq } from "@/lib/content/faqs";
import { faqAnswerText } from "@/lib/content/faqs";
import type { SiteContact, OpeningHours } from "@/lib/data/settings";
import type { PublicVan } from "@/lib/data/public-vans";

/**
 * Structured data.
 *
 * Rewritten in Phase 4. The inherited version published `AutoDealer` and
 * `Vehicle` offers, which describe a business that sells vehicles rather than
 * hires them out; both are gone. Phase 6 extends this with
 * the full per-route treatment; what is here is what §8 needs to ship the
 * static site: an `AutoRental` business, `Product` + `Offer` per van,
 * `FAQPage`, and breadcrumbs.
 *
 * Two rules govern everything below:
 *   1. Never mark up a claim that is not visible on the page. A `FAQPage` node
 *      only ever carries the questions actually rendered there.
 *   2. Never emit a field the client has not supplied. `openingHours`, `abn`
 *      and aggregate ratings are omitted entirely when absent rather than
 *      emitted empty — invented structured data is still an invented claim.
 */

export const ORGANIZATION_ID = `${siteBaseUrl()}/#organization`;
export const WEBSITE_ID = `${siteBaseUrl()}/#website`;
export const LOCAL_BUSINESS_ID = `${siteBaseUrl()}/#localbusiness`;

const DAY_SCHEMA: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** "7:00-17:00" → { opens, closes }. Returns null for "closed" or junk. */
function parseHours(value: string): { opens: string; closes: string } | null {
  const m = value.match(/^\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s*$/);
  if (!m) return null;
  return { opens: m[1], closes: m[2] };
}

export function openingHoursSpecification(hours: OpeningHours) {
  const spec = Object.entries(hours)
    .map(([day, value]) => {
      const parsed = parseHours(value);
      const dayName = DAY_SCHEMA[day];
      if (!parsed || !dayName) return null;
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayName,
        opens: parsed.opens,
        closes: parsed.closes,
      };
    })
    .filter(Boolean);
  return spec.length ? spec : undefined;
}

/**
 * `AutoRental` is a subtype of `LocalBusiness`, so one node carries both the
 * NAP signals and the vertical. Fields the client has not supplied are omitted
 * rather than emitted blank.
 */
export function autoRentalSchema(contact: SiteContact, hours: OpeningHours) {
  const hoursSpec = openingHoursSpecification(hours);
  return {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    "@id": LOCAL_BUSINESS_ID,
    name: contact.tradingName,
    url: siteBaseUrl(),
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      addressLocality: ADDRESS.suburb,
      addressRegion: ADDRESS.state,
      postalCode: ADDRESS.postcode,
      addressCountry: ADDRESS.country,
    },
    ...(contact.latitude != null && contact.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: contact.latitude,
            longitude: contact.longitude,
          },
        }
      : {}),
    areaServed: { "@type": "State", name: "New South Wales" },
    sameAs: [SOCIALS.instagram, SOCIALS.facebook],
    ...(hoursSpec ? { openingHoursSpecification: hoursSpec } : {}),
    slogan: BRAND.tagline,
  };
}

export function websiteSchema(contact: SiteContact) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteBaseUrl(),
    name: contact.tradingName,
    publisher: { "@id": LOCAL_BUSINESS_ID },
    inLanguage: "en-AU",
  };
}

/**
 * A van as `Product` + `Offer`.
 *
 * `price` is the weekly rate and is marked with `unitCode WEE`, because a bare
 * price on a hire product reads as a purchase price. Availability maps from
 * the van's own status; `draft` never reaches a public page.
 */
export function vanSchema(van: PublicVan, contact: SiteContact) {
  const availability =
    van.status === "available"
      ? "https://schema.org/InStock"
      : van.status === "limited"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteUrl(`/vans/${van.slug}`) + "#product",
    name: van.name,
    ...(van.description ? { description: van.description } : {}),
    ...(van.images.length ? { image: van.images.map((i) => i.url) } : {}),
    category: "Commercial van hire",
    ...(van.bodyType ? { model: van.bodyType } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/vans/${van.slug}`),
      priceCurrency: "AUD",
      price: van.priceWeeklyFrom,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: van.priceWeeklyFrom,
        priceCurrency: "AUD",
        unitCode: "WEE",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "WEE",
        },
      },
      availability,
      seller: { "@id": LOCAL_BUSINESS_ID },
      ...(contact.tradingName ? { offeredBy: { "@id": LOCAL_BUSINESS_ID } } : {}),
    },
  };
}

/**
 * `FAQPage` for the questions rendered on THIS page — never the full set on a
 * page showing six of them (§8).
 */
export function faqPageSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: faqAnswerText(f) },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListSchema(vans: PublicVan[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: vans.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/vans/${v.slug}`),
      name: v.name,
    })),
  };
}
