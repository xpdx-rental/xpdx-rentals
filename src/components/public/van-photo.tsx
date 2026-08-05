import Image from "next/image";
import { Camera } from "lucide-react";

/**
 * Van photograph, or a labelled placeholder.
 *
 * CLAUDE.md §1.5 and MOTION.md §9 are non-negotiable: real photographs of
 * XPDX's actual vans only. No stock, no AI-generated vehicles. A customer
 * collecting a van that does not match the photo is a complaint and an
 * Australian Consumer Law exposure.
 *
 * So where the client has not supplied a photo we render the expected filename
 * rather than substituting an image of someone else's van. It is deliberately
 * plain and obviously unfinished — it should look like a gap, because it is
 * one, and it is tracked in docs/handover.md.
 */
export function VanPhoto({
  src,
  alt,
  slug,
  shot = "side-profile",
  priority = false,
  sizes = "(max-width: 640px) 100vw, 33vw",
  className = "",
}: {
  src?: string | null;
  alt?: string | null;
  slug: string;
  shot?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (src && alt) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 bg-muted p-4 text-center">
      <Camera className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-xs font-medium text-muted-foreground">Photo to come</p>
      <code className="rounded bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground">
        {slug}-{shot}.jpg
      </code>
    </div>
  );
}
