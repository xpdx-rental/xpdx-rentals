import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact } from "@/lib/data/settings";
import { getSeoPage, getSeoRegistry } from "@/lib/seo/registry";
import { registryMetadata, suppressedMetadata } from "@/lib/seo/metadata";
import {
  findServiceByPathSegment,
  vansForService,
  serviceFromPrice,
} from "@/lib/seo/entities/services";
import { relatedServiceLinks, allLocationLinks } from "@/lib/seo/links";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbSchema,
  itemListSchema,
  faqPageSchema,
  serviceSchema,
  webPageSchema,
} from "@/lib/seo/jsonld";
import { SeoBreadcrumbs } from "@/components/seo/seo-breadcrumbs";
import { LinkCluster } from "@/components/seo/link-cluster";
import { ConversionBlock } from "@/components/seo/conversion-block";
import { VanCard } from "@/components/public/van-card";
import { FaqList } from "@/components/public/faq-list";
import { ALL_FAQS } from "@/lib/content/faqs";
import { HIRE_TERMS } from "@/lib/business";
import { formatWeekly, ROOF_LABELS } from "@/lib/van";

/**
 * `/[serviceSlug]` — the vehicle-category page family.
 *
 * ROOT-LEVEL DYNAMIC SEGMENT, ON PURPOSE.
 *
 * These pages live at `/cargo-van-hire`, not `/vans/type/cargo`, because the
 * URL is a ranking asset and burying the money keyword two segments deep gives
 * that up for tidiness nobody searches for.
 *
 * The obvious objection to a root-level `[serviceSlug]` is that it swallows the
 * site. It does not: Next resolves static routes before dynamic ones, so
 * `/faq`, `/vans`, `/van-hire`, `/about-us` and every other real page still win
 * at this depth. `dynamicParams = false` then closes the other end — a slug
 * `generateStaticParams` did not emit 404s instead of rendering. The set of
 * URLs this file can serve is exactly the set the quality gate approved.
 *
 * WHAT MAKES A CATEGORY PAGE REAL HERE
 *
 * Every one is a live query against the fleet (`service.matches`), not a
 * keyword with a template behind it. The vans shown, the from-price, the
 * spec ranges and the ItemList schema all come from that one predicate, so
 * they cannot contradict each other, and a category with nothing behind it
 * produces no page at all rather than an empty one.
 */

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ serviceSlug: string }> };

export async function generateStaticParams() {
  const registry = await getSeoRegistry();
  return registry
    .filter((p) => p.kind === "service" && p.decision.generate)
    // The registry stores the public path; the route param is its one segment.
    .map((p) => ({ serviceSlug: p.path.replace(/^\//, "") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { serviceSlug } = await params;
  const page = await getSeoPage(`/${serviceSlug}`);
  if (!page || !page.decision.generate) return suppressedMetadata(`/${serviceSlug}`);
  return registryMetadata(page);
}

export default async function ServicePage({ params }: Props) {
  const { serviceSlug } = await params;

  const [page, vans, contact, related, locations] = await Promise.all([
    getSeoPage(`/${serviceSlug}`),
    getPublicVans(),
    getSiteContact(),
    relatedServiceLinks(findServiceByPathSegment(serviceSlug)?.slug ?? ""),
    allLocationLinks(9),
  ]);

  const service = findServiceByPathSegment(serviceSlug);
  if (!page || !page.decision.generate || !service) notFound();

  const matched = vansForService(service, vans);
  if (matched.length < service.minVans) notFound();

  const from = serviceFromPrice(service, vans);
  const faqs = ALL_FAQS.filter((f) => service.faqIds.includes(f.id));

  // Spec ranges, computed from the matched subset only — so the numbers on
  // /refrigerated-van-hire describe refrigerated vans, not the whole fleet.
  const volumes = matched.map((v) => v.loadVolumeM3).filter((n): n is number => n != null);
  const payloads = matched.map((v) => v.payloadKg).filter((n): n is number => n != null);
  const seatCounts = matched.map((v) => v.seats).filter((n): n is number => n != null);

  const stats: { label: string; value: string }[] = [
    { label: matched.length === 1 ? "Vehicle" : "Vehicles", value: String(matched.length) },
    ...(from != null ? [{ label: "From", value: `${formatWeekly(from)}/week` }] : []),
    ...(volumes.length
      ? [
          {
            label: "Load volume",
            value:
              volumes.length === 1
                ? `${volumes[0]} m³`
                : `${Math.min(...volumes)}–${Math.max(...volumes)} m³`,
          },
        ]
      : []),
    ...(payloads.length
      ? [
          {
            label: "Payload",
            value:
              payloads.length === 1
                ? `${payloads[0]} kg`
                : `${Math.min(...payloads)}–${Math.max(...payloads)} kg`,
          },
        ]
      : []),
    ...(seatCounts.length && Math.max(...seatCounts) >= 4
      ? [
          {
            label: "Seats",
            value:
              Math.min(...seatCounts) === Math.max(...seatCounts)
                ? String(seatCounts[0])
                : `${Math.min(...seatCounts)}–${Math.max(...seatCounts)}`,
          },
        ]
      : []),
  ];

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
          serviceSchema({
            name: service.name,
            description: service.intro,
            path: service.path,
            fromWeeklyPrice: from,
            vans: matched,
          }),
          faqPageSchema(faqs),
          itemListSchema(matched),
        ]}
      />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SeoBreadcrumbs items={page.breadcrumbs} />

          <h1 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {page.h1}
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-body">{service.intro}</p>

          {/* Stats computed from the matched subset — the block genuinely
              differs between categories rather than restating the fleet. */}
          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</dt>
                <dd className="mt-1 font-heading text-lg font-bold tabular-nums text-foreground">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Why this category ── */}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Why hire this way
        </h2>
        <ul className="mt-5 space-y-3">
          {service.positioning.map((p) => (
            <li key={p} className="flex items-start gap-3 text-body">
              <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          All hires run for a minimum of {HIRE_TERMS.minHireDays} days, from our yard in Condell Park,
          and are approved for use across {HIRE_TERMS.stateOfUse}.{" "}
          <Link href="/faq" className="font-medium text-link hover:underline">
            Full hire terms
          </Link>
          .
        </p>
      </article>

      {/* ── The matched fleet ── */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {matched.length === 1
              ? "The vehicle in this category"
              : `The ${matched.length} vehicles in this category`}
          </h2>
          <p className="mt-2 max-w-2xl text-body">
            Listed cheapest first. Every rate is weekly and includes unlimited kilometres.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matched.map((v) => (
              <VanCard key={v.id} van={v} />
            ))}
          </div>

          {/* A comparison table is the module a category page owes a searcher
              who is choosing between two of them. Rows render only where the
              figure exists — never a guessed number. */}
          {matched.length > 1 ? (
            <div className="mt-10 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">
                  {service.name} — specifications and weekly rates compared
                </caption>
                <thead className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Van</th>
                    <th scope="col" className="px-4 py-3 font-medium">Roof</th>
                    <th scope="col" className="px-4 py-3 font-medium">Load volume</th>
                    <th scope="col" className="px-4 py-3 font-medium">Payload</th>
                    <th scope="col" className="px-4 py-3 font-medium">Seats</th>
                    <th scope="col" className="px-4 py-3 font-medium">From</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matched.map((v) => (
                    <tr key={v.id}>
                      <th scope="row" className="px-4 py-3 font-medium text-foreground">
                        <Link href={`/vans/${v.slug}`} className="hover:text-link hover:underline">
                          {v.name}
                        </Link>
                      </th>
                      <td className="px-4 py-3 text-muted-foreground">{ROOF_LABELS[v.roof]}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {v.loadVolumeM3 != null ? `${v.loadVolumeM3} m³` : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {v.payloadKg != null ? `${v.payloadKg} kg` : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {v.seats ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-foreground">
                        {formatWeekly(v.priceWeeklyFrom)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      <LinkCluster
        title="Related categories"
        description="Close enough to be worth a look, different enough to be worth their own page."
        links={related}
        columns={3}
      />

      <LinkCluster
        title="Collecting from your suburb"
        description="Same fleet and same rate wherever you drive in from — these pages just tell you how far it is."
        links={locations}
        columns={3}
      />

      {faqs.length ? (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Questions about {service.name.toLowerCase()}
            </h2>
            <div className="mt-6">
              <FaqList faqs={faqs} />
            </div>
          </div>
        </section>
      ) : null}

      <ConversionBlock
        heading={`Enquire about ${service.name.toLowerCase()}`}
        lead="Tell us what you are carrying and how long you need it, and we will confirm the right van and the weekly rate."
        phone={contact.phone}
        whatsapp={contact.whatsapp}
        whatsappMessage={`Hi XPDX Rentals, I'd like to enquire about ${service.name.toLowerCase()}.`}
      />
    </>
  );
}
