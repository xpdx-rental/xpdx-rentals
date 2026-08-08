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
        src="/images/xpdx-logo.png"
        alt="XPDX Rentals"
        width={1024}
        height={682}
        className={cn("h-10 w-auto", imageClassName)}
        priority={priority}
      />
    </div>
  );
}
