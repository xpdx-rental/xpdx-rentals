import type { Metadata } from "next";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact } from "@/lib/data/settings";
import { LoadMatcherLazy } from "@/components/fleet/fleet-visuals";
import { Star } from "lucide-react";
import { Suspense } from "react";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { JsonLd } from "@/components/json-ld";
import { itemListSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { corePage } from "@/lib/seo/entities/core-pages";
import { HIRE_TERMS, INCLUSIONS } from "@/lib/business";
import { FleetSearchFilter } from "@/components/public/fleet-search-filter";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata(corePage("/vans"));

export default async function VansPage() {
  const [vans, contact] = await Promise.all([getPublicVans(), getSiteContact()]);

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Our fleet", path: "/vans" },
          ]),
          ...(vans.length ? [itemListSchema(vans)] : []),
        ]}
      />

      {/* ── Fleet Hero Header ── */}
      <section className="relative border-b border-border bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[40vw] h-full bg-primary/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          {/* Trust Badge */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-muted-foreground text-xs font-medium tracking-wide">
              <span className="text-foreground font-bold">5.0</span> average on Google
            </span>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-[#EA580C]" />
            <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.2em]">Our Fleet</span>
          </div>
          
          <div className="flex flex-wrap items-end gap-6">
            <h1 className="font-heading text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              100+ Commercial Vehicles Available
            </h1>
            
            {/* Live Availability Indicator */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm mb-1.5">
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">
                Vans Available Today
              </span>
            </div>
          </div>
          
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Our 100+ strong fleet is professionally maintained and ready for the road. Every van is automatic, diesel, and fitted out for cargo — bulkhead, reverse camera and GPS
            tracking standard. {HIRE_TERMS.minHireDays}-day minimum hire.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {INCLUSIONS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-muted-foreground">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#EA580C] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Search, Filter & Fleet Grid ── */}
      {/*
        The visually-hidden <h2> is load-bearing, not decoration. `VanCard`
        titles each van with an <h3>, and this section previously had no
        heading of its own — so the document went straight from the page <h1>
        to a run of <h3>s. A screen-reader user navigating by heading (which is
        how most navigate a long listing page) hits a level that skips one and
        has no label telling them what the group of vans is. The homepage
        already solves this the same way with `<h2 className="sr-only">Our
        vans</h2>`; this makes /vans consistent with it.

        `aria-labelledby` on the section ties the region to that heading, so it
        is also announced when jumping between landmarks.
      */}
      <section aria-labelledby="fleet-grid" className="bg-gradient-to-b from-background via-background to-secondary/30 min-h-screen">
        <h2 id="fleet-grid" className="sr-only">
          Browse the fleet
        </h2>
        {vans.length === 0 ? (
          <p className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-center text-muted-foreground">
            Our fleet is not available to browse right now. Please call us.
          </p>
        ) : (
          <Suspense fallback={<div className="py-16 text-center text-muted-foreground">Loading fleet...</div>}>
            <FleetSearchFilter vans={vans} />
          </Suspense>
        )}
      </section>


      {vans.length > 0 ? (
        <section aria-labelledby="load-matcher" className="border-t border-border bg-muted py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#EA580C]" />
              <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">Load Guide</span>
            </div>
            <h2
              id="load-matcher"
              className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-2"
            >
              Will it fit?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mb-10">
              Pick what you are moving and see which vans are recommended, tight, or too small.
            </p>
            <LoadMatcherLazy
              vans={vans.map((v) => ({
                slug: v.slug,
                name: v.name,
                lengthMm: v.lengthMm,
                heightMm: v.heightMm,
                wheelbaseMm: v.wheelbaseMm,
                priceWeeklyFrom: v.priceWeeklyFrom,
                primaryImageUrl: v.primaryImage?.url ?? null,
                primaryImageAlt: v.primaryImage?.alt ?? null,
              }))}
            />
          </div>
        </section>
      ) : null}

      <section className="relative border-t border-border bg-background py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#EA580C]/[0.06] blur-[80px] rounded-full" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#EA580C]" />
              <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">Get a Quote</span>
              <div className="h-px w-8 bg-[#EA580C]" />
            </div>
            <h2 className="font-heading text-3xl font-black tracking-tight text-foreground">
              Not sure which van you need?
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Tell us what you&apos;re carrying and we&apos;ll point you at the right one.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-7 sm:p-9">
            <EnquiryForm phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
