import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Check } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { getPublicVanBySlug, getPublicVanSlugs } from "@/lib/data/public-vans";
import { getSiteContact } from "@/lib/data/settings";
import { VanPhoto } from "@/components/public/van-photo";
import { ContactLink } from "@/components/public/contact-link";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { Van360Button } from "@/components/public/van-360-button";
import { JsonLd } from "@/components/json-ld";
import { vanSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { registryMetadata, suppressedMetadata } from "@/lib/seo/metadata";
import { getSeoPage } from "@/lib/seo/registry";
import { formatWeekly, formatMm, ROOF_LABELS } from "@/lib/van";
import { telHref, waHref } from "@/lib/lead";
import { HIRE_TERMS, INCLUSIONS } from "@/lib/business";

export const revalidate = 300;
export const dynamicParams = true;

import { generatedSlugs } from "@/lib/seo/registry";

export async function generateStaticParams() {
  const slugs = await generatedSlugs("vehicle");
  return slugs.map((slug) => ({ slug }));
}

function vanTransitionName(kind: "photo" | "name" | "price", slug: string) {
  return { viewTransitionName: `van-${kind}-${slug}` } as React.CSSProperties;
}

/**
 * Metadata comes from the SEO registry, which already derives this page's
 * title, description, canonical and robots directive from the same van record
 * — including the operator's `seo_title` / `seo_description` overrides when
 * they are set. Building a second copy here is how a VDP ends up noindexed by
 * its own `<head>` while sitting in the sitemap.
 *
 * The fallback path stays: `getSeoPage` can miss during a build race or a
 * stale-param request, and returning an indexable head for a page about to
 * 404 is how soft-404s enter an index.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [page, van] = await Promise.all([
    getSeoPage(`/vans/${slug}`),
    getPublicVanBySlug(slug),
  ]);
  if (!page || !page.decision.generate || !van) return suppressedMetadata(`/vans/${slug}`);

  return registryMetadata(page, van.primaryImage?.url ?? null);
}

/** A spec row renders only when the figure exists — never a guessed number. */
function Spec({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export default async function VanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [van, contact] = await Promise.all([getPublicVanBySlug(slug), getSiteContact()]);
  if (!van) notFound();

  const waMessage = `Hi XPDX Rentals, I'd like to enquire about the ${van.name}.`;
  const unverifiedDims =
    van.loadVolumeM3 == null || van.payloadKg == null;

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Our fleet", path: "/vans" },
            { name: van.name, path: `/vans/${van.slug}` },
          ]),
          vanSchema(van, contact),
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link href="/vans" className="hover:text-link">
            Our fleet
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{van.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            {/*
              The LCP element. Rendered at full opacity with `priority` and no
              animation — MOTION.md §2.3 makes this a hard rule and Phase 4b
              must not change it.
            */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
              <span className="relative block size-full" style={vanTransitionName("photo", van.slug)}>
                <VanPhoto
                  src={van.primaryImage?.url}
                  alt={van.primaryImage?.alt}
                  slug={van.slug}
                  shot="side-profile"
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              </span>
              <Van360Button />
            </div>

            {van.images.length > 1 ? (
              <ul className="mt-3 grid grid-cols-4 gap-3">
                {van.images.slice(1, 5).map((img) => (
                  <li
                    key={img.url}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <VanPhoto src={img.url} alt={img.alt} slug={van.slug} sizes="25vw" />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <h1
              className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              style={vanTransitionName("name", van.slug)}
            >
              {van.name}
            </h1>
            <p className="mt-2 text-body">
              {ROOF_LABELS[van.roof]} · {van.tonnage}t · {van.transmission} · {van.fuel}
            </p>

            <p className="mt-6 text-muted-foreground">
              From{" "}
              <span
                className="font-heading text-4xl font-extrabold tabular-nums text-foreground"
                style={vanTransitionName("price", van.slug)}
              >
                {formatWeekly(van.priceWeeklyFrom)}
              </span>
              <span className="text-foreground">/week</span>
            </p>
            {van.priceMonthlyFrom ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Or from{" "}
                <span className="tabular-nums text-foreground">
                  {formatWeekly(van.priceMonthlyFrom)}
                </span>
                /month
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">
              {HIRE_TERMS.minHireDays} day minimum hire. Discounts at 3 and 6 months.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {contact.phone ? (
                <ContactLink
                  href={telHref(contact.phone)}
                  channel="call"
                  vanId={van.id}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Phone className="size-5" aria-hidden="true" /> Call {contact.phone}
                </ContactLink>
              ) : null}
              {contact.whatsapp ? (
                <ContactLink
                  href={waHref(contact.whatsapp, waMessage)}
                  channel="whatsapp"
                  vanId={van.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-5 font-bold text-foreground hover:border-primary hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <WhatsAppIcon className="size-5" aria-hidden="true" /> WhatsApp
                </ContactLink>
              ) : null}
            </div>

            <section aria-labelledby="specs" className="mt-8">
              <h2 id="specs" className="font-heading text-lg font-bold text-foreground">
                Specifications
              </h2>
              <dl className="mt-3 text-sm van-specs">
                <Spec label="Length" value={formatMm(van.lengthMm) === "—" ? null : formatMm(van.lengthMm)} />
                <Spec label="Height" value={formatMm(van.heightMm) === "—" ? null : formatMm(van.heightMm)} />
                <Spec label="Width" value={formatMm(van.widthMm) === "—" ? null : formatMm(van.widthMm)} />
                <Spec
                  label="Wheelbase"
                  value={formatMm(van.wheelbaseMm) === "—" ? null : formatMm(van.wheelbaseMm)}
                />
                <Spec
                  label="Load volume"
                  value={van.loadVolumeM3 == null ? null : `${van.loadVolumeM3} m³`}
                />
                <Spec label="Payload" value={van.payloadKg == null ? null : `${van.payloadKg} kg`} />
                <Spec label="Seats" value={van.seats == null ? null : String(van.seats)} />
              </dl>
              {unverifiedDims ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Load volume and payload for this van are confirmed on request — call us and
                  we’ll check before you book.
                </p>
              ) : null}
            </section>
          </div>
        </div>

        {van.description ? (
          <section className="mt-12 max-w-3xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              About this van
            </h2>
            <p className="mt-3 whitespace-pre-line text-body">{van.description}</p>
          </section>
        ) : null}

        <section aria-labelledby="included" className="mt-12">
          <h2 id="included" className="font-heading text-2xl font-bold tracking-tight text-foreground">
            What’s included
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUSIONS.map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-body">
                <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
                {i}
              </li>
            ))}
          </ul>
          {van.features.length ? (
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {van.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-body">
                  <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Enquire about the {van.name}
          </h2>
          <p className="mt-2 text-body">
            Fast approvals. Tell us when you need it and we’ll come back to you.
          </p>
          <div className="mt-6">
            <EnquiryForm vanSlug={van.slug} vanName={van.name} phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
