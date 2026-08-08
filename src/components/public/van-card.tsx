"use client";

import Link from "next/link";
import { VanTransitionLink } from "@/components/fleet/van-transition-link";
import { ArrowRight } from "lucide-react";
import { VanPhoto } from "@/components/public/van-photo";
import { formatWeekly, formatMm, ROOF_LABELS } from "@/lib/van";
import type { PublicVan } from "@/lib/data/public-vans";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";

function vanTransitionName(kind: "photo" | "name" | "price", slug: string) {
  return { viewTransitionName: `van-${kind}-${slug}` } as React.CSSProperties;
}

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
  
  // Spotlight effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };
  
  const spotlightBackground = useMotionTemplate`radial-gradient(500px circle at ${mouseX}px ${mouseY}px, rgba(201,171,129,0.1) 0%, transparent 80%)`;

  return (
    <motion.article
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      id={`van-card-${van.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-card/50 backdrop-blur-md shadow-lg transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(201,171,129,0.15)] hover:border-[#EA580C]/40 hover:-translate-y-1.5"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: spotlightBackground }}
      />
      
      <div className="relative z-20 flex flex-col h-full">
        <Link
        href={`/vans/${van.slug}`}
        className="relative aspect-[4/3] overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        tabIndex={-1}
        aria-hidden="true"
      >
        <span className="relative block size-full" style={vanTransitionName("photo", van.slug)}>
          <VanPhoto
            src={van.primaryImage?.url}
            alt={van.primaryImage?.alt}
            slug={van.slug}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08]"
          />
        </span>
        {/* Scrim: a fixed, subtle darkening at the base of every photo — not a
            hover effect. It's what keeps the status pill and (on the van's
            own page) the spec overlay readable against an arbitrary photo,
            without needing per-image contrast tuning. */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />
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
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(201,171,129,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View van
            <ArrowRight className="size-4" aria-hidden="true" />
          </VanTransitionLink>
        </div>
      </div>
      </div>
    </motion.article>
  );
}
