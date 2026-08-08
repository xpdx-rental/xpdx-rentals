import type { MetadataRoute } from "next";

/**
 * Web app manifest — REBRAND.md §5.
 *
 * `theme_color` is the brand orange exactly as §5 specifies. The icon it
 * points at is the typographic placeholder in `app/icon.svg`; the full set
 * (favicon.ico multi-res, apple-touch-icon, 192/512 PNGs, maskable) is
 * regenerated once the client supplies the vector.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XPDX Rentals",
    short_name: "XPDX",
    description: "Long-term cargo van hire in Sydney.",
    start_url: "/",
    display: "standalone",
    background_color: "#E9EAE8",
    theme_color: "#EA580C",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
