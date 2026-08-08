import { cn } from "@/lib/utils";
import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

/**
 * Brand logo component displaying the XPDX Rentals logo.
 */
export function BrandLogo({ className, imageClassName, priority = false }: BrandLogoProps) {
  return (
    <div className={cn("relative shrink-0 flex items-center", className)}>
      <Image
        src="/images/xpdx-logo-transparent.png"
        alt="XPDX Rentals"
        width={1000}
        height={300}
        className={cn("h-16 w-auto object-contain", imageClassName)}
        priority={priority}
      />
    </div>
  );
}
