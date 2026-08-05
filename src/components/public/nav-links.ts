/**
 * Public navigation links.
 *
 * In their own module with NO imports, deliberately.
 *
 * These used to live in `site-nav.tsx`, which is a Server Component that
 * imports `getSiteContact` → `lib/data/settings` → `lib/supabase/admin`. The
 * client-side `MobileNav` imported the constant from there, which dragged that
 * entire server module graph into the browser bundle: 57KB gzipped of Supabase
 * auth and realtime client on every public page, for a list of six links.
 *
 * Keep this file dependency-free. A single import here is worth tens of
 * kilobytes on every page.
 */
export const NAV_LINKS = [
  { href: "/vans", label: "Our fleet" },
  { href: "/business-van-rental", label: "Business hire" },
  { href: "/service-area", label: "Service area" },
  { href: "/about-us", label: "About us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact-us", label: "Contact" },
] as const;
