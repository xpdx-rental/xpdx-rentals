import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact } from "@/lib/data/settings";
import { getSeoPage, generatedSlugs } from "@/lib/seo/registry";
import { registryMetadata, suppressedMetadata } from "@/lib/seo/metadata";
import { findUseCase, recommendedVans } from "@/lib/data/use-cases";
import { jobServiceLinks, jobLinks } from "@/lib/seo/links";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbSchema,
  itemListSchema,
  faqPageSchema,
  webPageSchema,
} from "@/lib/seo/jsonld";
import { SeoBreadcrumbs } from "@/components/seo/seo-breadcrumbs";
import { LinkCluster } from "@/components/seo/link-cluster";
import { ConversionBlock } from "@/components/seo/conversion-block";
import { VanCard } from "@/components/public/van-card";
import { FaqList } from "@/components/public/faq-list";
import { ALL_FAQS } from "@/lib/content/faqs";
import { HIRE_TERMS } from "@/lib/business";

/**
 * `/use-cases/[slug]` — the job-to-be-done family.
 *
 * Rebuilt on the registry. The previous version had two problems:
 *
 *   1. Its `<h1>` and prose were the use-case title interpolated into a fixed
 *      sentence — "We've hand-picked the best vehicles for this specific job" —
 *      identical on all six. There was no per-job reasoning on a page whose
 *      entire premise is per-job reasoning. `fitNotes` replaces it.
 *   2. It said nothing about the 28-day minimum, on pages selling jobs that
 *      mostly last a day. `/use-cases/moving-house` invited exactly the visitor
 *      who cannot be served, and did it while indexable.
 *
 * The term-fit warning below is not a disclaimer bolted on for safety. It is
 * the most useful sentence on a `fair` or `poor` page, and putting it above the
 * fleet rather than below it is the difference between a qualified enquiry and
 * a wasted phone call.
 */

export const revalidate = 86400;
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };


export async function generateStaticParams() {
  const slugs = await generatedSlugs("use-case");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSeoPage(`/use-cases/${slug}`);
  if (!page || !page.decision.generate) return suppressedMetadata(`/use-cases/${slug}`);
  return registryMetadata(page);
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;

  const [page, vans, contact, serviceLinksOut, otherUseCases] = await Promise.all([
    getSeoPage(`/use-cases/${slug}`),
    getPublicVans(),
    getSiteContact(),
    jobServiceLinks(slug),
    jobLinks(slug),
  ]);

  const useCase = findUseCase(slug);
  if (!page || !page.decision.generate || !useCase) notFound();

  const recommended = recommendedVans(useCase, vans);

  const faqs = ALL_FAQS.filter((f) => useCase.faqIds.includes(f.id));

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
          faqPageSchema(faqs),
          ...(recommended.length ? [itemListSchema(recommended)] : []),
        ]}
      />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SeoBreadcrumbs items={page.breadcrumbs} />

          <h1 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {page.h1}
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-body">{useCase.description}</p>

          {/* Term fit, stated before the fleet rather than after it. On a
              `poor` page this is the only honest thing to lead with. */}
          {useCase.termFit !== "strong" ? (
            <div className="mt-7 flex max-w-2xl items-start gap-3 rounded-xl border border-border bg-card px-4 py-4">
              <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm text-body">
                <strong className="font-semibold text-foreground">
                  Worth knowing before you read on:
                </strong>{" "}
                our minimum hire is {HIRE_TERMS.minHireDays} days.{" "}
                {useCase.termFit === "poor"
                  ? "If you need a van for a weekend or a single day, we are not the right supplier — a daily-hire company will serve you better and we would rather say so here than take the phone call."
                  : "That suits work that runs for weeks or months, and does not suit a one-off booking."}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Per-job reasoning. The module that makes these pages distinct. ── */}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          What matters for {useCase.title.toLowerCase()}
        </h2>
        <ul className="mt-5 space-y-4">
          {useCase.fitNotes.map((note) => (
            <li key={note} className="flex gap-3 text-body">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </article>

      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {recommended.length === 1 ? "The van we would suggest" : "The vans we would suggest"}
          </h2>
          <p className="mt-2 max-w-2xl text-body">
            Picked for this job specifically, not the whole fleet ranked by price.
          </p>

          {recommended.length ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((van) => (
                <VanCard key={van.id} van={van} />
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              No vehicles are currently available for this category.
            </p>
          )}

          <p className="mt-6">
            <Link href="/vans" className="font-semibold text-link hover:underline">
              Compare the whole fleet →
            </Link>
          </p>
        </div>
      </section>

      <LinkCluster
        title="Hire by vehicle category"
        description="If you would rather start from the shape of the van than the job."
        links={serviceLinksOut}
        columns={3}
      />

      {faqs.length ? (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Questions that come up on this kind of work
            </h2>
            <div className="mt-6">
              <FaqList faqs={faqs} />
            </div>
          </div>
        </section>
      ) : null}

      <LinkCluster title="Other jobs we hire for" links={otherUseCases} columns={3} />

      <ConversionBlock
        heading="Tell us about the job"
        lead="The more we know about what you are moving and for how long, the sharper the recommendation."
        phone={contact.phone}
        whatsapp={contact.whatsapp}
        whatsappMessage={`Hi XPDX Rentals, I need a van for ${useCase.title.toLowerCase()}.`}
      />
    </>
  );
}
