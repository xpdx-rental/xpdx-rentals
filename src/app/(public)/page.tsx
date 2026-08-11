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
  MapPin,
  Clock,
  Star,
  MousePointerClick,
  FileCheck,
  Key,
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
import { corePage } from "@/lib/seo/entities/core-pages";
import { FEATURED_FAQS } from "@/lib/content/faqs";
import { ADVANTAGES } from "@/lib/content/about";
import { formatWeekly, formatMm } from "@/lib/van";
import { RentDriveThrive } from "@/components/public/rent-drive-thrive";

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

// Copy lives in `entities/core-pages.ts`, shared with the SEO registry so the
// sitemap and /admin/seo describe the page this route actually ships.
//
// The `title: { absolute }` override this used to carry is gone: `pageMetadata`
// now suppresses the root layout's title template for any title that already
// names the brand, so the special case is handled once for every page rather
// than remembered here.
export const metadata: Metadata = pageMetadata(corePage("/"));

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

      <RentDriveThrive />

      {/* Who We Are */}
      <section aria-labelledby="who-we-are" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 relative z-10">
        <FadeIn>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 id="who-we-are" className="sr-only">Who we are</h2>
              <SplitTextReveal
                text="Local, reliable van hire in Sydney"
                as="div"
                className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              />
              <p className="mt-6 text-lg text-body">
                Based in Condell Park, XPDX Rentals is a proudly local business focused on providing 
                dependable cargo vans for individuals and businesses across Sydney. Whether you&apos;re moving 
                house, handling an overflow of deliveries, or need a long-term commercial fleet addition, 
                we ensure you get the right vehicle at an honest price.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Condell Park</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Conveniently located for quick pickup and drop-off.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Flexible Hire</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Short-term jobs or long-term commercial solutions.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl lg:aspect-[4/3]">
              <Image
                src="/images/xpdx-fleet-compound-branded.webp"
                alt="XPDX Rentals fleet compound in Sydney"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </FadeIn>
      </section>

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
                  {/*
                    No `priority` here. It used to be `priority={i < 3}`, which
                    emitted three high-priority `<link rel="preload">` tags for
                    van photographs that sit thousands of pixels below the fold,
                    behind the hero, the "who we are" section and a heading.
                    They competed for bandwidth with the actual LCP element (the
                    hero poster) and then went unused — Chrome logs "preloaded
                    using link preload but not used within a few seconds from
                    the window's load event" three times on every homepage load.
                    `priority` belongs on the one image that IS the LCP, which
                    on this site is the van detail page's hero.
                  */}
                  <VanCard van={v} />
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

      {/* How it Works */}
      <section aria-labelledby="how-it-works" className="relative border-t border-border bg-card overflow-hidden">
        <div aria-hidden="true" className="ambient-glow -left-40 top-40 size-[32rem] bg-primary/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <FadeIn className="text-center">
            <h2 id="how-it-works" className="sr-only">How it works</h2>
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Zap className="size-4" /> Process
            </div>
            <SplitTextReveal
              text="Simple 3-step process"
              as="div"
              className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
            />
            <p className="mx-auto mt-6 max-w-2xl text-body">
              We&apos;ve stripped away the complexity. Getting your van on the road is fast, straightforward, and completely transparent.
            </p>
          </FadeIn>
          
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose & Enquire",
                desc: "Browse our fleet and select the van that fits your job. Send us a quick enquiry or call us directly.",
                icon: MousePointerClick
              },
              {
                step: "02",
                title: "Fast Approval",
                desc: "We verify your details swiftly without endless paperwork. Transparent pricing means no hidden surprises.",
                icon: FileCheck
              },
              {
                step: "03",
                title: "Pick Up & Drive",
                desc: "Collect your van from our Condell Park depot. Fully maintained, insured, and ready for the road.",
                icon: Key
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
              <FadeIn key={item.step} delay={i * 0.15} direction="up" className="relative group">
                <div className="card-lift relative h-full overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:bg-primary/[0.02]">
                  {/* Step Number Background Glow */}
                  <div className="absolute -right-4 -top-6 text-9xl font-black text-primary/5 transition-transform duration-500 group-hover:-translate-y-2 group-hover:text-primary/10 select-none">
                    {item.step}
                  </div>
                  
                  <div className="relative z-10">
                    <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                {i < 2 && (
                  <div className="absolute top-1/2 -right-4 hidden w-8 -translate-y-1/2 translate-x-1/2 lg:block text-border group-hover:text-primary transition-colors z-20">
                    <ArrowRight className="size-6 mx-auto" />
                  </div>
                )}
              </FadeIn>
            )})}
          </div>
        </div>
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
            <div className="mt-6 flex items-center gap-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-muted-foreground text-sm font-medium tracking-wide">
                <span className="text-foreground font-bold">5.0</span> average on Google
              </span>
            </div>
            <p className="mt-4 max-w-xl text-body">
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

      {/* Scale & Trust */}
      <section aria-labelledby="scale-trust" className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="py-4">
                <div className="text-5xl font-black text-primary mb-2">100+</div>
                <div className="text-foreground font-semibold">Vans in Fleet</div>
                <div className="text-sm text-muted-foreground mt-1">Ready to work across NSW</div>
              </div>
              <div className="py-4">
                <div className="text-5xl font-black text-primary mb-2">24/7</div>
                <div className="text-foreground font-semibold">Roadside Support</div>
                <div className="text-sm text-muted-foreground mt-1">Always there when you need us</div>
              </div>
              <div className="py-4">
                <div className="text-5xl font-black text-primary mb-2">28</div>
                <div className="text-foreground font-semibold">Day Minimum</div>
                <div className="text-sm text-muted-foreground mt-1">Flexible commercial terms</div>
              </div>
            </div>
          </FadeIn>
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
              Tell us what you need and when. Don&apos;t let vehicle downtime cost your business. Tap into our 100+ strong fleet today.
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
