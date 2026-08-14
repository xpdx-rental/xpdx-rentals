import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Truck, Briefcase } from "lucide-react";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact } from "@/lib/data/settings";
import { getSeoPage } from "@/lib/seo/registry";
import { pageMetadata } from "@/lib/seo/metadata";
import { corePage } from "@/lib/seo/entities/core-pages";
import { serviceLinks, allLocationLinks, jobLinks } from "@/lib/seo/links";
import { SEO_SERVICES, vansForService, serviceFromPrice } from "@/lib/seo/entities/services";
import { activeRegions, verifiedLocations } from "@/lib/seo/entities/locations";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/jsonld";
import { SeoBreadcrumbs } from "@/components/seo/seo-breadcrumbs";
import { LinkCluster } from "@/components/seo/link-cluster";
import { ConversionBlock } from "@/components/seo/conversion-block";
import { HIRE_TERMS } from "@/lib/business";
import { formatWeekly } from "@/lib/van";

/**
 * `/van-hire` — the hub of the programmatic estate.
 *
 * Every generated page's breadcrumb passes through here, which makes it the
 * page that collects their internal-link equity and the page that makes them
 * discoverable in one hop from the site root. It is not decoration: without a
 * hub, forty suburb and category pages are forty orphans, and Google treats an
 * orphaned programmatic page exactly as it looks — as something nobody
 * intended a human to find.
 *
 * It also owns the head query, "van hire sydney". The registry's
 * cannibalisation pass builds core pages first precisely so this page wins
 * that keyword rather than a generated category page taking it.
 */

export const revalidate = 86400;

/**
 * Synchronous, from the shared core-page copy.
 *
 * This used to `await getSeoPage("/van-hire")` with a hand-written fallback —
 * a fleet read on every metadata generation, plus a second copy of the title
 * that would go stale the first time the real one changed. The registry reads
 * the same `corePage("/van-hire")` entry, so both agree by construction.
 */
export const metadata: Metadata = pageMetadata(corePage("/van-hire"));

export default async function VanHireHubPage() {
  const [vans, contact, page, services, locations, useCases] = await Promise.all([
    getPublicVans(),
    getSiteContact(),
    getSeoPage("/van-hire"),
    serviceLinks(),
    allLocationLinks(),
    jobLinks(),
  ]);

  const breadcrumbs = page?.breadcrumbs ?? [
    { name: "Home", path: "/" },
    { name: "Van hire", path: "/van-hire" },
  ];

  const cheapest = vans.length
    ? [...vans].sort((a, b) => a.priceWeeklyFrom - b.priceWeeklyFrom)[0]
    : null;
  const regions = activeRegions();
  const suburbCount = verifiedLocations().length;

  // Categories, with their real match counts. The counts come from the same
  // predicate the registry gated on, so a number here can never disagree with
  // the page it links to.
  const categories = SEO_SERVICES.map((s) => ({
    service: s,
    count: vansForService(s, vans).length,
    from: serviceFromPrice(s, vans),
  })).filter((c) => c.count >= c.service.minVans);

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema(breadcrumbs),
          webPageSchema({
            path: "/van-hire",
            name: page?.h1 ?? "Van hire in Sydney",
            description: page?.description ?? "",
            lastModified: page?.lastModified,
          }),
        ]}
      />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SeoBreadcrumbs items={breadcrumbs} />

          <h1 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Van hire in Sydney
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-body">
            Every van we hire is an automatic diesel, fitted out for work and collected from our yard
            at {contact.address}. Hires run for a minimum of {HIRE_TERMS.minHireDays} days
            {cheapest ? ` and start at ${formatWeekly(cheapest.priceWeeklyFrom)} a week` : ""} — with
            unlimited kilometres, comprehensive insurance and servicing included in the rate.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Truck, label: "By vehicle", value: `${categories.length} categories`, href: "#categories" },
              { icon: MapPin, label: "By suburb", value: `${suburbCount} suburbs`, href: "#suburbs" },
              { icon: Briefcase, label: "By job", value: `${useCases.length} use cases`, href: "#jobs" },
            ].map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/50"
              >
                <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
                  <span className="block font-semibold text-foreground">{value}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── By vehicle category ── */}
      <section id="categories" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Hire by vehicle category
        </h2>
        <p className="mt-2 max-w-2xl text-body">
          Each category below is a live query against the fleet — the counts and rates are what we
          actually have on the yard, not a brochure.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categories.map(({ service, count, from }) => (
            <li key={service.slug}>
              <Link
                href={service.path}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-link">
                  {service.name}
                </h3>
                <p className="mt-2 flex-grow text-sm text-muted-foreground">{service.intro}</p>
                <p className="mt-4 border-t border-border pt-4 text-sm">
                  <span className="font-semibold text-foreground">
                    {count} {count === 1 ? "vehicle" : "vehicles"}
                  </span>
                  {from != null ? (
                    <span className="text-muted-foreground"> · from {formatWeekly(from)}/week</span>
                  ) : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── By suburb ── */}
      <div id="suburbs" className="border-t border-border bg-muted/20 py-4">
        <LinkCluster
          title="Hire by suburb"
          description={
            regions.length
              ? `Suburbs with a measured drive time from the Condell Park yard, across ${regions
                  .map((r) => r.name)
                  .join(", ")}. Closest first.`
              : undefined
          }
          links={locations}
          columns={3}
        />
      </div>

      {/* ── By job ── */}
      <div id="jobs">
        <LinkCluster
          title="Hire by job"
          description="What the van is for usually settles which one you want faster than the spec sheet does."
          links={useCases}
          columns={3}
        />
      </div>

      <LinkCluster
        title="Related pages"
        links={[
          { href: "/vans", label: "Compare the whole fleet", sublabel: "Specs, load volume and weekly rates" },
          { href: "/service-area", label: "Where we hire from", sublabel: "Condell Park, and use across NSW" },
          { href: "/faq", label: "Hire terms and eligibility", sublabel: "Bond, minimum term, insurance" },
        ]}
        columns={3}
      />

      <ConversionBlock
        heading="Not sure which van you need?"
        lead="Tell us what you are carrying and roughly how long you need it, and we will point you at the right one."
        phone={contact.phone}
        whatsapp={contact.whatsapp}
        whatsappMessage="Hi XPDX Rentals, I'd like to enquire about hiring a van."
      />

      {/* Services deliberately linked as plain prose too: the crawler reaches
          them from the card grid above, but a human skimming the bottom of a
          hub page gets a second, lower-friction route in. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <p>
            More:{" "}
            {services.map((s, i) => (
              <span key={s.href}>
                {i > 0 ? " · " : ""}
                <Link href={s.href} className="hover:text-link hover:underline">
                  {s.label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </section>
    </>
  );
}
