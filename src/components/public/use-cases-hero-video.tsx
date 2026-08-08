import { BackgroundVideo } from "@/components/public/background-video";

/**
 * Full-bleed hero clip for the use-cases directory.
 *
 * The clip is an XPDX-liveried Sprinter, generated with Gemini and processed by
 * `scripts/prepare-hero-video.mjs` before it landed here: the generator's
 * sparkle watermark is removed with ffmpeg's `delogo`, the (never-audible)
 * audio track is stripped, and the result is re-encoded with `+faststart`. It
 * is 850 KB, down from the 1.1 MB clip it replaced. Never drop a raw generator
 * export into `public/` — it arrives watermarked and with an audio track this
 * muted element cannot play.
 *
 * See `BackgroundVideo` for why the clip is not fetched eagerly.
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
