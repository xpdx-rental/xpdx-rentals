import type { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  ArrowRight,
  Infinity as InfinityIcon,
  Shield,
  Wrench,
  Calendar,
  Zap,
  Users,
  Tag,
  Headphones,
  Cog,
  Quote,
  type LucideIcon,
} from "lucide-react";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact, getOpeningHours } from "@/lib/data/settings";
import { getApprovedTestimonials } from "@/lib/data/content";
import Image from "next/image";
import { VanCard } from "@/components/public/van-card";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { FaqSummaryList } from "@/components/public/faq-list";
import { FadeIn } from "@/components/animations/fade-in";
import { SplitTextReveal } from "@/components/animations/split-text-reveal";
import { ArtisticHero } from "@/components/public/artistic-hero";
import { SizeGuideVideo } from "@/components/public/size-guide-video";
import { JsonLd } from "@/components/json-ld";
import { autoRentalSchema, websiteSchema, faqPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { FEATURED_FAQS } from "@/lib/content/faqs";
import { ADVANTAGES } from "@/lib/content/about";
import { HIRE_TERMS, BRAND } from "@/lib/business";
import { formatWeekly, formatMm } from "@/lib/van";
import { telHref } from "@/lib/lead";

const ADVANTAGE_ICONS: Record<string, LucideIcon> = {
  infinity: InfinityIcon,
  shield: Shield,
  phone: Phone,
  wrench: Wrench,
  calendar: Calendar,
  zap: Zap,
  users: Users,
  tag: Tag,
  headset: Headphones,
  cog: Cog,
};

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
      <ArtisticHero contact={contact} cheapest={cheapest} vans={vans} />
      {/* Fleet */}
      <section aria-labelledby="fleet" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 relative z-10">
        <FadeIn>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="fleet" className="sr-only">Our vans</h2>
              <SplitTextReveal
                text="Our vans"
                as="div"
                className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
              />
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
                <FadeIn key={v.id} delay={i * 0.1}>
                  <VanCard van={v} priority={i < 3} />
                </FadeIn>
              ))}
            </div>

            {/*
              Size guide, condensed. Phase 4b replaces this with the true-to-
              scale FleetLine drawing (MOTION.md §4.1) and keeps this table as
              the no-JS, screen-reader version underneath.
            */}
            <section aria-labelledby="size-guide" className="mt-14">
              <FadeIn delay={0.2}>
                <h2
                  id="size-guide"
                  className="font-heading text-2xl font-bold tracking-tight text-foreground"
                >
                Which size do I need?
              </h2>
              <p className="mt-2 max-w-xl text-body">
                Every van is measured the same way you&apos;d measure a job — length, height, and what it
                costs to have it for the week.
              </p>
              <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
                <SizeGuideVideo />
              </div>

              <div className="mt-6 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <caption className="sr-only">Van lengths, heights and weekly rates</caption>
                  <thead className="border-b border-border bg-muted/50 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="p-3.5 sm:p-4">Van</th>
                      <th scope="col" className="p-3.5 sm:p-4">Length</th>
                      <th scope="col" className="p-3.5 sm:p-4">Height</th>
                      <th scope="col" className="p-3.5 text-right sm:p-4">From</th>
                      <th scope="col" className="p-3.5 sr-only sm:p-4">View</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {vans.map((v) => (
                      <tr
                        key={v.id}
                        className="group border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                      >
                        <th scope="row" className="p-3.5 font-sans font-medium sm:p-4">
                          <Link
                            href={`/vans/${v.slug}`}
                            className="hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >
                            {v.name}
                          </Link>
                        </th>
                        <td className="p-3.5 tabular-nums text-body sm:p-4">{formatMm(v.lengthMm)}</td>
                        <td className="p-3.5 tabular-nums text-body sm:p-4">{formatMm(v.heightMm)}</td>
                        <td className="p-3.5 text-right tabular-nums font-semibold text-foreground sm:p-4">
                          {formatWeekly(v.priceWeeklyFrom)}/wk
                        </td>
                        <td className="p-3.5 text-right sm:p-4">
                          <Link
                            href={`/vans/${v.slug}`}
                            aria-label={`View ${v.name}`}
                            className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-link opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            View <ArrowRight className="size-3" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </FadeIn>
            </section>
          </>
        )}
        </FadeIn>
      </section>

      {/* Why us — the ten stated advantages, verbatim and unabridged. Layout
          only: sticky intro beside a card grid, breaking from the pure-
          centered rhythm of the sections around it. */}
      {/* Why us */}
      <section aria-labelledby="why-us" className="relative overflow-hidden border-y border-border bg-muted/10">
        <div aria-hidden="true" className="ambient-glow -left-40 top-0 size-[26rem] bg-primary/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-16">
            <FadeIn>
              <div className="lg:sticky lg:top-28">
                <h2 id="why-us" className="sr-only">Why hire with us</h2>
                <SplitTextReveal
                  text="Why hire with us"
                  as="div"
                  className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
                />
                <p className="mt-3 text-body">
                  Ten things you don&apos;t have to ask about, because they&apos;re already included.
                </p>
              </div>
            </FadeIn>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ADVANTAGES.map((a, i) => {
                const Icon = ADVANTAGE_ICONS[a.icon] ?? Zap;
                return (
                  <FadeIn key={a.label} delay={i * 0.05} direction="up">
                    <div className="card-lift group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/30">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="pt-1.5 font-medium text-foreground">{a.label}</span>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews. Hidden entirely when there are none — no invented proof. */}
      {testimonials.length > 0 ? (
        <section aria-labelledby="reviews" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div aria-hidden="true" className="ambient-glow -right-24 top-10 size-96 bg-primary/5" />
          <FadeIn>
            <h2 id="reviews" className="sr-only">What our customers say</h2>
            <SplitTextReveal
              text="What our customers say"
              as="div"
              className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
            />
            <p className="mt-3 max-w-xl text-body">
              Straight from the people who&apos;ve hired from us — nothing staged, nothing invented.
            </p>
          </FadeIn>
          <ul className="relative mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeIn key={t.id} delay={i * 0.08} direction="up">
                <li className="card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                  <Quote className="size-6 fill-primary/15 text-primary/40" aria-hidden="true" />
                  <p className="mt-3 flex-1 text-body">{t.quote}</p>
                  <p className="mt-5 border-t border-border pt-4 text-sm font-semibold text-foreground">
                    {t.customerName}
                  </p>
                </li>
              </FadeIn>
            ))}
          </ul>
        </section>
      ) : null}

      {/* FAQ — the six starred questions, each linking through to /faq. */}
      <section aria-labelledby="faq" className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
          <FadeIn>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">FAQ</span>
            </div>
            <h2 id="faq" className="sr-only">Common questions</h2>
            <SplitTextReveal
              text="Common questions"
              as="div"
              className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
            />
          </FadeIn>
          <div className="mt-8">
            <FaqSummaryList faqs={FEATURED_FAQS} />
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section aria-labelledby="enquire" className="relative overflow-hidden border-t border-border bg-muted/30">
        <div aria-hidden="true" className="ambient-glow left-1/2 top-0 size-[32rem] -translate-x-1/2 bg-primary/5" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
          <FadeIn>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Get in touch</span>
            </div>
            <h2 id="enquire" className="sr-only">Get a quote</h2>
            <SplitTextReveal
              text="Get a quote"
              as="div"
              className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
            />
            <p className="mt-3 text-body">
              Tell us what you need and when. Fast approvals, transparent pricing, no obligation.
            </p>
          </FadeIn>
          <div className="mt-10 rounded-3xl border border-border bg-card/60 p-6 shadow-md backdrop-blur-sm sm:p-9">
            <EnquiryForm phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
