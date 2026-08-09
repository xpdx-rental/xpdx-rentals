import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { siteBaseUrl } from "@/lib/seo/site";
import { LenisProvider } from "@/components/animations/lenis-provider";
import { NoiseOverlay } from "@/components/animations/noise-overlay";
import { AnalyticsTracker } from "@/components/public/analytics-tracker";

// REBRAND.md §5 type stack. Inter and Plus Jakarta Sans — the previous faces —
// are gone from next/font, the CSS and the preconnects.
//
//   Display  Archivo         headings, uppercase, wdth 105–118, wght 750–900
//   Body     IBM Plex Sans   everything readable
//   Utility  IBM Plex Mono   specs, prices, plates, eyebrows, labels
//
// Mono for specs is deliberate: it is the vernacular of spec sheets and number
// plates, and it makes dimension tables align.
//
// `fallback` supplies metric-adjacent system faces so the swap does not shift
// layout before the webfont lands. next/font options must be written literals —
// the loader runs at build time and cannot resolve a shared constant, so the
// fallback arrays are repeated rather than extracted.

/**
 * One font, loaded once.
 *
 * This was three separate `Inter()` calls — `interDisplay`, `interSans` and
 * `interMono` — differing only in which CSS variable they exported and whether
 * they set `preload`. They are the same family and the same subset, so
 * `next/font` emitted the *same* woff2 twice: once as the preloaded copy for
 * the two `preload: true` instances and once as a plain copy for the
 * `preload: false` one. The browser downloaded both.
 *
 * Measured on the production build: two requests for the identical file,
 * 47 KB each — 94 KB of fonts where 47 KB was needed, on every cold visit,
 * plus 24 `@font-face` declarations for a single family.
 *
 * One instance exports all three variable names instead. `globals.css` already
 * resolves `--font-heading` from `--font-display` and falls back through
 * `ui-monospace` for `--font-mono`, so nothing about the rendered type changes.
 *
 * (The comment that used to sit here described an Archivo / IBM Plex Sans /
 * IBM Plex Mono stack. That is not what the code loads, and has not been for
 * some time — every one of the three was Inter.)
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // REBRAND.md §5 specifies the brand orange for the manifest theme colour, so
  // the browser chrome matches rather than contradicting it. See
  // docs/conversion/01-plan.md Q7 on the exact orange.
  themeColor: "#EA580C",
};

export const metadata: Metadata = {
  title: {
    default: "XPDX Rentals — van hire in Sydney",
    template: "%s | XPDX Rentals",
  },
  description:
    "Long-term cargo van hire from Condell Park, Sydney. Unlimited kilometres, comprehensive insurance and 24/7 roadside assistance included. 28 day minimum hire.",
  metadataBase: new URL(siteBaseUrl()),
  // NOTE: no `alternates.canonical` here — on purpose.
  // Next.js inherits layout metadata into every descendant route, so declaring
  // `canonical: "/"` at the root made every listing, landing page and vehicle
  // detail page emit a canonical pointing at the homepage. Google treats that
  // as "this URL is a duplicate of the homepage" and drops the page from the
  // index. Each route now declares its own self-referencing canonical via
  // `canonical()` from `@/lib/seo/site`.
  applicationName: "XPDX Rentals",
  // Phase 1 deleted the inherited favicon/icon/OG asset set (REBRAND.md §3.2).
  // Phase 7 regenerates the full XPDX set and restores these declarations.

  // Legacy iOS (< 16.4) reads the apple-prefixed flag for standalone launch;
  // Next emits the modern `mobile-web-app-capable`, so add the legacy one too.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    // No `url` here: like canonical, a hardcoded homepage URL would be
    // inherited by every route. Each page sets its own via `pageMetadata`.
    siteName: "XPDX Rentals",
    title: "XPDX Rentals — van hire in Sydney",
    description:
      "Long-term cargo van hire from Condell Park, Sydney. Unlimited kilometres, comprehensive insurance and 24/7 roadside assistance included.",
  },
  twitter: {
    card: "summary_large_image",
    title: "XPDX Rentals — van hire in Sydney",
    description:
      "Long-term cargo van hire with unlimited kilometres and insurance included. 28 day minimum.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "vdZAgv7uS9NQbHjKoE-Dtl1N-OOLr--wd4pmSHPSGmA",
  },
};

/**
 * GTM container. Defaults to the client's existing container per CLAUDE.md §10.
 * Set NEXT_PUBLIC_GTM_ID to override, or to "" to disable tagging entirely.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-M7BWGFK5";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`dark ${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground font-sans tracking-tight">
        <AnalyticsTracker />
        <NoiseOverlay />
        <LenisProvider>
        {/*
          Google Tag Manager. CLAUDE.md §10: "Preserve the existing GTM container
          (GTM-M7BWGFK5) unless told otherwise" — that container is the client's
          own, so it is the default rather than a hardcode, overridable with
          NEXT_PUBLIC_GTM_ID.

          REBRAND.md §7 requires confirming with the client whether to keep it or
          start fresh; a container must never be shared between two clients.
          Until that is confirmed, §10 wins and this preserves theirs.

          `afterInteractive` rather than `lazyOnload`: the enquiry form and the
          tel:/wa.me links push conversion events to `dataLayer`, and a container
          that loads only at idle can miss a fast caller. Both push sites are
          guarded, so nothing breaks if GTM is absent.
        */}
        {GTM_ID ? (
          <>
            <Script id="gtm-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];`}
            </Script>
            <Script id="gtm" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
                title="Google Tag Manager"
              />
            </noscript>
          </>
        ) : null}
        {/*
          Phase 4 removed the floating WhatsApp button and the scroll-to-top
          control. The WhatsApp button hardcoded the OTHER CLIENT's real phone
          number (REBRAND.md §3.2) — a Phase 1 miss — and both floated over the
          sticky call bar that §8 requires under 700px. Contact now lives in
          the header, the sticky bar and the footer, all fed from settings.
        */}
        {/*
          No client providers at the root. MobileStateProvider and
          MobileAnimationProvider came from the previous build and had no remaining
          consumers, but they forced a client boundary — and their bundle — onto
          every page including fully static ones. The sonner <Toaster> moved to
          the admin layout, which is the only place anything calls toast().
        */}
        {children}
        </LenisProvider>
        {/*
          @vercel/analytics and @vercel/speed-insights were removed here. They
          inject script tags pointing at /_vercel/insights and
          /_vercel/speed-insights, which only exist when deployed on Vercel — on
          any other host they are two 404s on every page load, and they counted
          against the MOTION.md §10 initial-JS budget for nothing.

          REBRAND.md §7 requires a fresh GA4 property and a decision on the GTM
          container at infra time; GA is already wired above via
          NEXT_PUBLIC_GA_MEASUREMENT_ID. Re-add these at deploy if the site does
          land on Vercel.
        */}
      </body>
    </html>
  );
}
