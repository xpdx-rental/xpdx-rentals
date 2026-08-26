import type { SearchIntent } from "@/lib/seo/entities/services";

/**
 * The hand-authored pages — home, the fleet hub, the three service pages, and
 * the trust/utility pages.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 *
 * These pages are NOT generated: their copy is written by a human and should
 * stay that way. But the SEO registry still has to know about them, because it
 * builds the sitemap, runs the cannibalisation pass, and reports the estate at
 * `/admin/seo`.
 *
 * The first version of the registry solved that by carrying its OWN titles and
 * descriptions for these paths. It was wrong within a day: `/faq` shipped "Van
 * hire FAQ — bond, insurance, eligibility" while the registry claimed "Van Hire
 * FAQ", so the audit table described a page that did not exist, and the
 * hand-authored copy — which was better than the registry's guess — was the
 * version nobody could see from the audit surface.
 *
 * Two copies of a page's title is exactly the drift the whole registry design
 * exists to prevent, so the copy lives here, in a leaf module with no imports
 * of its own, and BOTH sides read it:
 *
 *   • `lib/seo/registry.ts`  → sitemap, cannibalisation, /admin/seo
 *   • the route's `page.tsx` → the actual `<title>` and `<meta>`
 *
 * A leaf module also keeps this synchronous. Routing these pages through
 * `getSeoRegistry()` in an async `generateMetadata` would work, but it would
 * turn ten static `export const metadata` declarations into async functions
 * that each await a fleet read, for copy that never changes. This costs
 * nothing and cannot drift.
 *
 * `/privacy-policy` and `/terms-of-hire` are deliberately absent: they are
 * noindex placeholders until the client supplies the text, and a page that is
 * not in this file is not in the sitemap.
 */

export type CorePage = {
  /** Clean, query-free path. Also the registry key. */
  path: string;
  /** Shipped verbatim as the page `<title>`. */
  title: string;
  /** Shipped verbatim as the meta description. */
  description: string;
  /** Heading shown in breadcrumbs and the audit table. */
  h1: string;
  /**
   * The one query this page owns.
   *
   * Load-bearing: the registry's cannibalisation pass processes core pages
   * FIRST, so whatever is claimed here beats any generated page competing for
   * the same term. Two core pages must never claim the same keyword —
   * `core-pages.test.ts` enforces it, after `/` and `/van-hire` both claimed
   * "van hire sydney" and the pass quietly canonicalised the estate's own hub
   * onto the home page.
   */
  primaryKeyword: string;
  intent: SearchIntent;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  /**
   * True when the page's content moves with the fleet, so `lastModified`
   * should track the freshest van rather than the deploy date. A sitemap that
   * claims every page changed today teaches Google to ignore the field.
   */
  tracksFleet: boolean;
};

export const CORE_PAGES: CorePage[] = [
  {
    path: "/",
    title: "Van hire Sydney — long-term cargo van rental | XPDX Rentals",
    description:
      "Long-term cargo van hire from Condell Park, Sydney. Unlimited kilometres, insurance and 24/7 roadside assistance included. 28 day minimum hire.",
    h1: "XPDX Rentals",
    primaryKeyword: "van hire sydney",
    intent: "transactional",
    priority: 1,
    changeFrequency: "weekly",
    tracksFleet: true,
  },
  {
    path: "/van-hire",
    // No brand suffix: the root layout's title template appends it. See
    // `resolveTitle` in lib/seo/metadata.ts for why some entries here carry
    // the brand and others must not.
    title: "Van rental Sydney — by category, suburb and job",
    description:
      "Every way to hire a van from XPDX Rentals in Sydney — by vehicle category, by suburb, and by the job you need it for.",
    h1: "Van hire in Sydney",
    // NOT "van hire sydney": the home page owns that. See the note on
    // `primaryKeyword` above — this is the collision that actually happened.
    primaryKeyword: "van rental sydney",
    intent: "transactional",
    priority: 0.9,
    changeFrequency: "weekly",
    tracksFleet: true,
  },
  {
    path: "/vans",
    title: "Our van fleet — HiAce and Sprinter hire",
    description:
      "Compare our cargo vans by size and weekly rate. Automatic diesel HiAce and Sprinter vans, with unlimited kilometres and insurance included.",
    h1: "Our fleet",
    primaryKeyword: "van hire fleet sydney",
    intent: "commercial-investigation",
    priority: 0.9,
    changeFrequency: "weekly",
    tracksFleet: true,
  },
  {
    path: "/use-cases",
    title: "Search Vans by Use Case — XPDX Rentals",
    description:
      "Find the perfect van for your job. Whether you're moving house, doing courier deliveries, or need trade transport, we have the right vehicle for you.",
    h1: "Find the right van for your job",
    primaryKeyword: "which van do i need sydney",
    intent: "commercial-investigation",
    priority: 0.7,
    changeFrequency: "monthly",
    tracksFleet: false,
  },
  {
    path: "/local-van-hire",
    title: "Local van hire, Condell Park",
    description:
      "Local van hire from our Condell Park yard, serving south-west and greater Sydney. Unlimited kilometres, in-house mechanic, 28 day minimum.",
    h1: "Local van hire in Sydney",
    primaryKeyword: "local van hire sydney",
    intent: "local",
    priority: 0.8,
    changeFrequency: "monthly",
    tracksFleet: false,
  },
  {
    path: "/delivery-van-for-rent",
    title: "Delivery van for rent — unlimited km",
    description:
      "Courier and delivery van hire in Sydney with genuinely unlimited kilometres. Automatic diesel vans, insurance and 24/7 roadside assistance included.",
    h1: "Delivery van for rent",
    primaryKeyword: "delivery van for rent sydney",
    intent: "transactional",
    priority: 0.8,
    changeFrequency: "monthly",
    tracksFleet: false,
  },
  {
    path: "/business-van-rental",
    title: "Business van rental in NSW",
    description:
      "Commercial van rental for NSW businesses. One van or a whole fleet, with maintenance, insurance and support included. 28 day minimum hire.",
    h1: "Business van rental",
    primaryKeyword: "business van rental nsw",
    intent: "commercial-investigation",
    priority: 0.8,
    changeFrequency: "monthly",
    tracksFleet: false,
  },
  {
    path: "/service-area",
    title: "Service area — Sydney and NSW",
    description:
      "XPDX Rentals hires vans from Condell Park in south-west Sydney. Our vans are approved for use across New South Wales, with interstate travel by prior arrangement.",
    h1: "Service area",
    primaryKeyword: "van hire service area sydney",
    intent: "local",
    priority: 0.7,
    changeFrequency: "monthly",
    tracksFleet: false,
  },
  {
    path: "/faq",
    title: "Van hire FAQ — bond, insurance, eligibility",
    description:
      "Bond, insurance, minimum hire period, kilometre limits, who can rent, servicing and payment. Everything you need to know before hiring a van from XPDX Rentals.",
    h1: "Frequently asked questions",
    primaryKeyword: "van hire questions sydney",
    intent: "commercial-investigation",
    priority: 0.7,
    changeFrequency: "monthly",
    tracksFleet: false,
  },
  {
    path: "/about-us",
    title: "About us — family-owned van hire",
    description:
      "XPDX Rentals is a family-owned commercial vehicle rental business in Condell Park, Sydney. Who we are, our mission, and what every hire includes.",
    h1: "About us",
    primaryKeyword: "xpdx rentals",
    intent: "commercial-investigation",
    priority: 0.6,
    changeFrequency: "monthly",
    tracksFleet: false,
  },
  {
    path: "/contact-us",
    title: "Contact us — our yard at Condell Park",
    description:
      "Call, message or email XPDX Rentals. Our yard is at 16 Ilma Street, Condell Park NSW 2200. Send an enquiry and we'll come back to you quickly.",
    h1: "Contact us",
    primaryKeyword: "xpdx rentals contact",
    intent: "transactional",
    priority: 0.7,
    changeFrequency: "monthly",
    tracksFleet: false,
  },
  {
    path: "/blog",
    title: "Blog — insights, guides, and tips",
    description: "Insights, guides, and tips for long-term cargo van hire in Sydney from XPDX Rentals.",
    h1: "Blog",
    primaryKeyword: "van hire blog sydney",
    intent: "commercial-investigation",
    priority: 0.6,
    changeFrequency: "weekly",
    tracksFleet: false,
  },
];

/**
 * Look up a core page by path.
 *
 * Throws rather than returning null on purpose. Every caller is a route that
 * knows its own literal path, so a miss is always a typo or a deleted entry,
 * and the useful moment to find out is at build time — not by shipping a page
 * with no `<title>` and a canonical pointing nowhere.
 */
export function corePage(path: string): CorePage {
  const found = CORE_PAGES.find((p) => p.path === path);
  if (!found) {
    throw new Error(
      `[seo] No CORE_PAGES entry for "${path}". Add one in lib/seo/entities/core-pages.ts — ` +
        "a page missing from that file is also missing from the sitemap and the cannibalisation pass.",
    );
  }
  return found;
}
