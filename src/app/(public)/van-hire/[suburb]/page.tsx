import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation, MapPin, Clock } from "lucide-react";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact } from "@/lib/data/settings";
import { getSeoPage, generatedSlugs } from "@/lib/seo/registry";
import { registryMetadata, suppressedMetadata } from "@/lib/seo/metadata";
import { findLocation, regionName } from "@/lib/seo/entities/locations";
import { nearbyLocationLinks, serviceLinks } from "@/lib/seo/links";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbSchema,
  itemListSchema,
  faqPageSchema,
  locationServiceSchema,
  webPageSchema,
} from "@/lib/seo/jsonld";
import { SeoBreadcrumbs } from "@/components/seo/seo-breadcrumbs";
import { LinkCluster } from "@/components/seo/link-cluster";
import { ConversionBlock } from "@/components/seo/conversion-block";
import { VanCard } from "@/components/public/van-card";
import { FaqList } from "@/components/public/faq-list";
import { ALL_FAQS } from "@/lib/content/faqs";
import { ADDRESS, HIRE_TERMS } from "@/lib/business";
import { formatWeekly } from "@/lib/van";

/**
 * `/van-hire/[suburb]` — the geographic page family.
 *
 * REPLACES `/locations/[slug]`, which had three problems this template exists
 * to fix:
 *
 *   1. Its URL targeted nothing. Nobody searches "locations bankstown"; they
 *      search "van hire bankstown". `/van-hire/bankstown` is the query.
 *   2. It rendered the entire fleet and one paragraph, identically, ten times.
 *      That is a doorway page by any definition Google uses.
 *   3. Its breadcrumb and BreadcrumbList schema both linked to `/locations`,
 *      a hub that was never built — a 404 in the structured data.
 *
 * The old paths 301 here (see `next.config.ts`). They were never deployed, so
 * no index equity moves; the redirects exist because a URL that once resolved
 * in a preview should not start 404ing.
 *
 * WHAT MAKES THESE PAGES NOT THIN
 *
 * Honestly: less than a multi-depot operator could manage, and the template is
 * built around that limit rather than papering over it. XPDX has ONE yard. The
 * genuinely per-suburb facts are the measured drive time, the region and
 * postcode, the computed nearest-suburb set, and a directions link seeded with
 * the suburb. Everything else — the fleet, the terms, the FAQs — is shared, and
 * is presented as shared rather than reworded ten ways to look bespoke.
 *
 * That is why only ten of these exist. `entities/locations.ts` holds twenty
 * more candidate suburbs and generates pages for none of them, because they
 * have no measured drive time and would therefore have nothing per-suburb to
 * say. Spun differently — with an LLM writing 400 words of "Bankstown is a
 * vibrant hub in south-west Sydney" per suburb — this family could be two
 * hundred pages tomorrow. That is exactly the estate that gets demoted
 * wholesale, and it is not what this is.
 */

export const revalidate = 3600;
/** A suburb the gate rejected is a 404, not a thin page. */
export const dynamicParams = true;

type Props = { params: Promise<{ suburb: string }> };

import { generatedSlugs } from "@/lib/seo/registry";

export async function generateStaticParams() {
  const slugs = await generatedSlugs("location");
  return slugs.map((slug) => ({ suburb: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { suburb } = await params;
  const page = await getSeoPage(`/van-hire/${suburb}`);
  if (!page || !page.decision.generate) return suppressedMetadata(`/van-hire/${suburb}`);
  return registryMetadata(page);
}

const FAQ_IDS = ["minimum-rental-period", "kilometre-limits", "who-can-rent", "security-bond"];

export default async function SuburbVanHirePage({ params }: Props) {
  const { suburb } = await params;

  const [page, location, vans, contact, nearby, services] = await Promise.all([
    getSeoPage(`/van-hire/${suburb}`),
    Promise.resolve(findLocation(suburb)),
    getPublicVans(),
    getSiteContact(),
    nearbyLocationLinks(suburb),
    serviceLinks(undefined, 6),
  ]);

  if (!page || !page.decision.generate || !location || location.driveMinutes == null) notFound();

  const available = vans.filter((v) => v.status !== "draft");
  // The vans this page actually renders. `ItemList` is built from THIS array,
  // not from `available`: the grid shows six, and marking up ten would be
  // describing four vans that are not on the page — the same rule that governs
  // the FAQ markup below.
  const shown = available.slice(0, 6);
  const cheapest = available.length
    ? [...available].sort((a, b) => a.priceWeeklyFrom - b.priceWeeklyFrom)[0]
    : null;
  const faqs = ALL_FAQS.filter((f) => FAQ_IDS.includes(f.id));
  const region = regionName(location.regionSlug);

  const directionsHref = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    `${location.name} NSW ${location.postcode ?? ""}`.trim(),
  )}&destination=${encodeURIComponent(ADDRESS.full)}`;

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema(page.breadcrumbs),
          webPageSchema({
            path: page.path,
            name: page.h1,
            description: page.description,
            lastModified: page.lastModified,
          }),
          locationServiceSchema({
            suburb: location.name,
            region,
            postcode: location.postcode,
            path: page.path,
            driveMinutes: location.driveMinutes,
            fromWeeklyPrice: cheapest?.priceWeeklyFrom ?? null,
          }),
          // Only the questions actually rendered below are marked up.
          faqPageSchema(faqs),
          ...(shown.length ? [itemListSchema(shown)] : []),
        ]}
      />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SeoBreadcrumbs items={page.breadcrumbs} />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="h-px w-8 bg-primary" />
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <MapPin className="size-4" aria-hidden="true" />
              {region}
            </span>
          </div>

          <h1 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Van hire in {location.name}
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-body">
            We do not have a counter in {location.name} — we have a yard, {location.driveMinutes} minutes
            away at {ADDRESS.full}, and it is the same fleet and the same rate whichever suburb you
            drive in from.
          </p>

          {/* ── The genuinely per-suburb panel ───────────────────────────────
              Drive time, postcode, region and a directions link seeded with
              THIS suburb. Every value below differs from every sibling page;
              that is the point of the block. */}
          <dl className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card px-4 py-3.5">
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" /> Drive to the yard
              </dt>
              <dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
                {location.driveMinutes} min
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3.5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Suburb</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {location.name}
                {location.postcode ? (
                  <span className="text-muted-foreground"> {location.postcode}</span>
                ) : null}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3.5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">From</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {cheapest ? `${formatWeekly(cheapest.priceWeeklyFrom)}/week` : "Call for rates"}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
            <Navigation className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm text-body">
              {location.accessVia
                ? `Most customers come in via ${location.accessVia}. `
                : ""}
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-link hover:underline"
              >
                Directions from {location.name} to the yard →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── What hiring from here actually involves ── */}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Hiring a van from {location.name}
        </h2>
        <p className="mt-3 text-body">
          Collection and return are both at the Condell Park yard — {location.driveMinutes} minutes
          from {location.name}. Once you have the keys the van is approved for use across{" "}
          {HIRE_TERMS.stateOfUse}, so where you started from stops mattering the moment you drive
          out.
        </p>
        <p className="mt-3 text-body">
          The minimum hire is {HIRE_TERMS.minHireDays} days. That is worth knowing before you
          enquire: this is long-term hire for trades, couriers and businesses, not a counter you can
          borrow a van from for a Saturday.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          We have not published a delivery service for {location.name} because we do not offer one.
          If that changes it will say so here.{" "}
          <Link href="/service-area" className="font-medium text-link hover:underline">
            See the full service area
          </Link>
          .
        </p>
      </article>

      {/* ── The fleet. Shared across suburb pages, and presented as such. ── */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            The fleet available to {location.name} customers
          </h2>
          <p className="mt-2 max-w-2xl text-body">
            One yard, one fleet — every van below is available to you, at the same weekly rate as any
            other suburb.
          </p>

          {shown.length ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((v) => (
                <VanCard key={v.id} van={v} />
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              Our fleet is not available to browse right now. Please call us.
            </p>
          )}

          {available.length > 6 ? (
            <p className="mt-6">
              <Link href="/vans" className="font-semibold text-link hover:underline">
                Compare all {available.length} vans →
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      <LinkCluster
        title={`Suburbs near ${location.name}`}
        description="Ordered by how far they are from the yard, closest first."
        links={nearby}
        columns={3}
      />

      <LinkCluster
        title="Hire by vehicle category"
        description="If you already know the shape of van you need, start here instead."
        links={services}
        columns={3}
      />

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Before you enquire
          </h2>
          <div className="mt-6">
            <FaqList faqs={faqs} />
          </div>
          <p className="mt-6 text-sm">
            <Link href="/faq" className="font-medium text-link hover:underline">
              All hire questions answered →
            </Link>
          </p>
        </div>
      </section>

      <ConversionBlock
        heading={`Enquire about a van in ${location.name}`}
        lead={`Tell us what you are carrying and how long you need it. We are ${location.driveMinutes} minutes away, so collection is usually the easy part.`}
        phone={contact.phone}
        whatsapp={contact.whatsapp}
        whatsappMessage={`Hi XPDX Rentals, I'm in ${location.name} and I'd like to enquire about hiring a van.`}
      />
    </>
  );
}
