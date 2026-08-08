import { BackgroundVideo } from "@/components/public/background-video";

/**
 * Full-bleed hero clip for the business van rental page.
 *
 * Delegates to `BackgroundVideo`, which paints the poster through `next/image`
 * and only fetches the clip once the page is idle and the visitor's connection
 * has not asked us not to. Previously this was a bare `<video preload="auto">`
 * that pulled the full 3 MB `hero-van.mp4` at high priority on first paint.
 */
export function BusinessHeroVideo() {
  return (
    <BackgroundVideo
      src="/videos/hero-van.mp4"
      poster="/business-hero-poster.jpg"
      className="size-full"
    />
  );
}
