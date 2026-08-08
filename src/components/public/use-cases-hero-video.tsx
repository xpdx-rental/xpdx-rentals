import { BackgroundVideo } from "@/components/public/background-video";

/**
 * Full-bleed hero clip for the use-cases directory.
 *
 * See `BackgroundVideo` for why the clip is no longer fetched eagerly — this
 * page's 1.1 MB hero used to download at high priority alongside the LCP image.
 */
export function UseCasesHeroVideo() {
  return (
    <BackgroundVideo
      src="/videos/use-cases-hero.mp4"
      poster="/use-cases-hero-poster.jpg"
      className="size-full"
    />
  );
}
