import Link from "next/link";
import { VanTransitionLink, vanTransitionName } from "@/components/fleet/van-transition-link";
import { ArrowRight } from "lucide-react";
import { VanPhoto } from "@/components/public/van-photo";
import { formatWeekly, formatMm, ROOF_LABELS } from "@/lib/van";
import type { PublicVan } from "@/lib/data/public-vans";

/**
 * Fleet card.
 *
 * The image, name and weekly price carry `view-transition-name` so they morph
 * into their positions on the van's own page rather than being replaced
 * (MOTION.md §4.3). Browsers without View Transitions just navigate.
 *
 * A van is a fleet model, not a unit that sells once — so there is no "sold",
 * no reserve, and the price is a weekly rate, always prefixed "From" and
 * suffixed "/week". A bare number on a hire product reads as a purchase price.
 */
export function VanCard({ van, priority = false }: { van: PublicVan; priority?: boolean }) {
  const unavailable = van.status === "unavailable";

  return (
    <article
      id={`van-card-${van.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <Link
        href={`/vans/${van.slug}`}
        className="relative aspect-[4/3] overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        tabIndex={-1}
        aria-hidden="true"
      >
        <span className="block size-full" style={vanTransitionName("photo", van.slug)}>
          <VanPhoto
            src={van.primaryImage?.url}
            alt={van.primaryImage?.alt}
            slug={van.slug}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </span>
        {van.status === "limited" ? (
          <span className="absolute left-3 top-3 rounded-full bg-warning px-2.5 py-1 text-xs font-bold text-black">
            Limited availability
          </span>
        ) : null}
        {unavailable ? (
          <span className="absolute left-3 top-3 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
            Currently unavailable
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3
          className="font-heading text-lg font-bold leading-snug text-foreground"
          style={vanTransitionName("name", van.slug)}
        >
          <VanTransitionLink
            href={`/vans/${van.slug}`}
            className="hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {van.name}
          </VanTransitionLink>
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {ROOF_LABELS[van.roof]} · {van.tonnage}t · {van.transmission}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-y-2 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
          <div>
            <dt className="sr-only">Length</dt>
            <dd>L {formatMm(van.lengthMm)}</dd>
          </div>
          <div>
            <dt className="sr-only">Height</dt>
            <dd>H {formatMm(van.heightMm)}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="text-sm text-muted-foreground">
            From{" "}
            <span
              className="font-heading text-2xl font-extrabold tabular-nums text-foreground"
              style={vanTransitionName("price", van.slug)}
            >
              {formatWeekly(van.priceWeeklyFrom)}
            </span>
            <span className="text-foreground">/week</span>
          </p>
          <VanTransitionLink
            href={`/vans/${van.slug}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View van
            <ArrowRight className="size-4" aria-hidden="true" />
          </VanTransitionLink>
        </div>
      </div>
    </article>
  );
}
