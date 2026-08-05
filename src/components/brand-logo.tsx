import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

/**
 * Phase 1 deleted the inherited logo asset (REBRAND.md §3.2). Phase 7 sources the
 * XPDX vector from the client and restores an <Image>. Until then this renders
 * a plain wordmark so nothing 404s and no other client's mark is served.
 */
export function BrandLogo({ className, imageClassName }: BrandLogoProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <span
        className={cn(
          "font-heading text-2xl font-extrabold tracking-tight text-foreground",
          imageClassName,
        )}
      >
        XPDX
      </span>
    </div>
  );
}
