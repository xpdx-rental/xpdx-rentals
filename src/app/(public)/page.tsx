import type { Metadata } from "next";
import Link from "next/link";
import { Phone, ArrowRight, Check } from "lucide-react";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact, getOpeningHours } from "@/lib/data/settings";
import { getApprovedTestimonials } from "@/lib/data/content";
import { VanCard } from "@/components/public/van-card";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { FaqSummaryList } from "@/components/public/faq-list";
import { VanScene } from "@/components/animations/van-scene";
import { JsonLd } from "@/components/json-ld";
import { autoRentalSchema, websiteSchema, faqPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { FEATURED_FAQS } from "@/lib/content/faqs";
import { ADVANTAGES } from "@/lib/content/about";
import { HIRE_TERMS, BRAND } from "@/lib/business";
import { formatWeekly, formatMm } from "@/lib/van";
import { telHref } from "@/lib/lead";

export const revalidate = 300;

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/",
    title: "Van hire Sydney — long-term cargo van rental | XPDX Rentals",
    description:
      "Long-term cargo van hire from Condell Park, Sydney. Unlimited kilometres, insurance and 24/7 roadside assistance included. 28 day minimum hire.",
  }),
  title: { absolute: "Van hire Sydney — long-term cargo van rental | XPDX Rentals" },
};

export default async function HomePage() {
  const [vans, contact, hours, testimonials] = await Promise.all([
    getPublicVans(),
    getSiteContact(),
    getOpeningHours(),
    getApprovedTestimonials(3),
  ]);

  const cheapest = vans.length
    ? vans.reduce((min, v) => (v.priceWeeklyFrom < min ? v.priceWeeklyFrom : min), Infinity)
    : null;

  return (
    <>
      <JsonLd
        schema={[
          autoRentalSchema(contact, hours),
          websiteSchema(contact),
          // The six questions actually rendered below — never the full set on
          // a page showing a subset (§8).
          faqPageSchema(FEATURED_FAQS),
        ]}
      />

      {/*
        Hero. The H1 is the LCP element: painted immediately, at full opacity,
        with no fade and no stagger. MOTION.md §2.3 makes this a hard rule and
        Phase 4b must not animate it.
      */}
      <section className="border-b border-border bg-muted/30 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="relative z-20">
            <p className="font-mono text-sm font-medium uppercase tracking-widest text-link">
              {BRAND.tagline}
            </p>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Long-term van hire for Sydney trades and couriers
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-body">
              Automatic diesel cargo vans from our yard at Condell Park. Unlimited kilometres,
              comprehensive insurance and 24/7 roadside assistance included in every hire.
              {HIRE_TERMS.minHireDays} day minimum.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/vans"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-6 font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                See the fleet
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              {contact.phone ? (
                <a
                  href={telHref(contact.phone)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-6 font-bold text-foreground hover:border-primary hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Phone className="size-5" aria-hidden="true" />
                  {contact.phone}
                </a>
              ) : null}
            </div>

            {cheapest !== null && Number.isFinite(cheapest) ? (
              <p className="mt-6 font-mono text-sm text-muted-foreground">
                From {formatWeekly(cheapest as number)} per week · Unlimited km · Insurance included
              </p>
            ) : null}
          </div>
          <div className="mt-12 lg:mt-0 relative z-10 -mx-4 sm:mx-0">
            <VanScene />
          </div>
        </div>
      </section>

      {/* Fleet */}
      <section aria-labelledby="fleet" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="fleet"
              className="font-heading text-3xl font-extrabold tracking-tight text-foreground"
            >
              Our vans
            </h2>
            <p className="mt-2 text-body">
              Six cargo vans, from a HiAce for courier rounds to a long-wheelbase high-roof
              Sprinter.
            </p>
          </div>
          <Link
            href="/vans"
            className="font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View all vans →
          </Link>
        </div>

        {vans.length === 0 ? (
          <p className="mt-8 rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Our fleet is not available to browse right now. Please call us and we’ll talk you
            through what’s available.
          </p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vans.slice(0, 6).map((v, i) => (
                <VanCard key={v.id} van={v} priority={i < 3} />
              ))}
            </div>

            {/*
              Size guide, condensed. Phase 4b replaces this with the true-to-
              scale FleetLine drawing (MOTION.md §4.1) and keeps this table as
              the no-JS, screen-reader version underneath.
            */}
            <section aria-labelledby="size-guide" className="mt-14">
              <h2
                id="size-guide"
                className="font-heading text-2xl font-bold tracking-tight text-foreground"
              >
                Which size do I need?
              </h2>
              <div className="mt-5 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <caption className="sr-only">Van lengths, heights and weekly rates</caption>
                  <thead className="border-b border-border bg-muted/50 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="p-3">Van</th>
                      <th scope="col" className="p-3">Length</th>
                      <th scope="col" className="p-3">Height</th>
                      <th scope="col" className="p-3">From</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {vans.map((v) => (
                      <tr key={v.id} className="border-b border-border last:border-0">
                        <th scope="row" className="p-3 font-sans font-medium">
                          <Link href={`/vans/${v.slug}`} className="hover:text-link">
                            {v.name}
                          </Link>
                        </th>
                        <td className="p-3 tabular-nums text-body">{formatMm(v.lengthMm)}</td>
                        <td className="p-3 tabular-nums text-body">{formatMm(v.heightMm)}</td>
                        <td className="p-3 tabular-nums text-foreground">
                          {formatWeekly(v.priceWeeklyFrom)}/wk
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>

      {/* Why us — the ten stated advantages, verbatim and unabridged. */}
      <section aria-labelledby="why-us" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2
            id="why-us"
            className="font-heading text-3xl font-extrabold tracking-tight text-foreground"
          >
            Why hire with us
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map((a) => (
              <li key={a.label} className="flex items-start gap-3 text-body">
                <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
                <span className="font-medium text-foreground">{a.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reviews. Hidden entirely when there are none — no invented proof. */}
      {testimonials.length > 0 ? (
        <section aria-labelledby="reviews" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2
            id="reviews"
            className="font-heading text-3xl font-extrabold tracking-tight text-foreground"
          >
            What our customers say
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <li key={t.id} className="rounded-xl border border-border bg-card p-6">
                <p className="text-body">“{t.quote}”</p>
                <p className="mt-4 text-sm font-semibold text-foreground">{t.customerName}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* FAQ — the six starred questions, each linking through to /faq. */}
      <section aria-labelledby="faq" className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <h2
            id="faq"
            className="font-heading text-3xl font-extrabold tracking-tight text-foreground"
          >
            Common questions
          </h2>
          <div className="mt-8">
            <FaqSummaryList faqs={FEATURED_FAQS} />
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section aria-labelledby="enquire" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <h2
            id="enquire"
            className="font-heading text-3xl font-extrabold tracking-tight text-foreground"
          >
            Get a quote
          </h2>
          <p className="mt-2 text-body">
            Tell us what you need and when. Fast approvals, transparent pricing, no obligation.
          </p>
          <div className="mt-8">
            <EnquiryForm phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
