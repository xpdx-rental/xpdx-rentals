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
    <div className={cn("relative shrink-0 flex items-center", className)}>
      <svg
        viewBox="0 0 400 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-10 w-auto", imageClassName)}
        aria-label="XPDX Rentals"
      >
        {/* XPDX Main Text */}
        <text
          x="0"
          y="75"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="95"
          fill="#F5F4F2"
          letterSpacing="-4"
        >
          XPDX
        </text>
        {/* Registered Trademark symbol */}
        <text
          x="280"
          y="35"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="18"
          fill="#C9AB81"
        >
          ®
        </text>
        {/* RENTALS Subtext */}
        <text
          x="165"
          y="110"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          fontSize="34"
          fill="#F5F4F2"
          letterSpacing="1"
        >
          RENTALS
        </text>
        {/* Vertical Divider */}
        <rect x="310" y="25" width="4" height="85" fill="#C9AB81" rx="2" />
        {/* RENT DRIVE THRIVE */}
        <text
          x="325"
          y="45"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="20"
          fill="#C9AB81"
          letterSpacing="1"
        >
          RENT
        </text>
        <text
          x="325"
          y="75"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="20"
          fill="#C9AB81"
          letterSpacing="1"
        >
          DRIVE
        </text>
        <text
          x="325"
          y="105"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="20"
          fill="#C9AB81"
          letterSpacing="1"
        >
          THRIVE.
        </text>
      </svg>
    </div>
  );
}
