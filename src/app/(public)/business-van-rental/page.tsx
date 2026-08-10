import type { Metadata } from "next";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact } from "@/lib/data/settings";
import { VanCard } from "@/components/public/van-card";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { FaqList } from "@/components/public/faq-list";
import { JsonLd } from "@/components/json-ld";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { corePage } from "@/lib/seo/entities/core-pages";
import { AnimatedSection } from "@/components/animations/animated-section";
import { SplitTextReveal } from "@/components/animations/split-text-reveal";
import { FadeIn } from "@/components/animations/fade-in";
import { BusinessHeroVideo } from "@/components/public/business-hero-video";
import { ALL_FAQS } from "@/lib/content/faqs";
import { HIRE_TERMS } from "@/lib/business";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata(corePage("/business-van-rental"));

/**
 * Service page 3 of 3.
 *
 * ⚠ ALL PROSE ON THIS PAGE IS NEWLY AUTHORED and needs client approval —
 * `docs/content/supplied-copy.md` has no service-page copy. Written in the
 * client's register and using only facts authorised by CLAUDE.md §3.
 *
 * This page's angle: HIRE VERSUS OWNING, AND SCALE — the operating-cost case,
 * additional drivers, scaling a fleet up and down, and how payment works.
 * Deliberately does not repeat the proximity angle of /local-van-hire or the
 * unlimited-km economics of /delivery-van-for-rent.
 *
 * Careful: nothing here may read as financial or tax advice. The wording below
 * describes what is included in a hire and stops there.
 */

const FAQ_IDS = ["fleet-solutions", "payment", "additional-drivers", "documents"];

export default async function BusinessVanRentalPage() {
  const [vans, contact] = await Promise.all([getPublicVans(), getSiteContact()]);
  const faqs = ALL_FAQS.filter((f) => FAQ_IDS.includes(f.id));
  // Largest vans: the usual choice for trade and freight work.
  const suggested = [...vans].sort((a, b) => b.tonnage - a.tonnage).slice(0, 3);

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Business van rental", path: "/business-van-rental" },
          ]),
          faqPageSchema(faqs),
        ]}
      />

      <section className="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <BusinessHeroVideo />
          {/* Million dollar cinematic lighting */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute left-0 top-0 h-[60vh] w-[60vw] bg-primary/20 blur-[160px] mix-blend-screen opacity-50" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-40 pb-24 sm:px-6 lg:px-8 flex flex-col justify-end min-h-[85vh]">
          <div className="flex flex-col items-start max-w-3xl">
            {/* Trust Badge */}
            <FadeIn direction="up" delay={0.1}>
              <div className="flex items-center gap-3 mb-8 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 transition-all hover:bg-white/20">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 text-[#EA580C] fill-[#EA580C] drop-shadow-md" />
                  ))}
                </div>
                <div className="h-4 w-[1px] bg-white/20 mx-1" />
                <span className="text-[12px] font-bold tracking-[0.2em] text-white uppercase">
                  5.0 Google Average
                </span>
              </div>
            </FadeIn>

            <SplitTextReveal
              text="Business Van Rental"
              as="h1"
              className="font-heading text-6xl font-black tracking-tighter text-white sm:text-7xl lg:text-[7rem] leading-[0.9] drop-shadow-2xl"
            />

            <FadeIn delay={0.4} direction="up" className="mt-8">
              <p className="text-xl sm:text-2xl font-light leading-relaxed text-white/80 drop-shadow-lg">
                One van or a whole fleet, on terms that flex with the work. Maintenance, insurance
                and support are part of the hire, not extras you manage separately.
              </p>
            </FadeIn>
            
            {/* Live Availability Indicator */}
            <FadeIn delay={0.5} direction="up" className="mt-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-md transition-colors hover:bg-white/20">
                <div className="relative flex size-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]"></span>
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-white">
                  Vans Available Today
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <AnimatedSection>
          <SplitTextReveal className="font-heading text-2xl font-bold tracking-tight text-foreground">
            One predictable weekly cost
          </SplitTextReveal>
          <p className="mt-3 text-body">
            Running your own vans means carrying registration, insurance, servicing, repairs and
            the cost of a vehicle sitting idle between contracts. Hiring folds the running costs
            into a single weekly rate, so the number you plan around is the number you pay.
          </p>
          <p className="mt-3 text-body">
            Whether hiring or owning suits your business is a question for your own accountant —
            we are not advisers, and we will not pretend otherwise. What we can tell you plainly
            is what is included, and it is on this page.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <SplitTextReveal className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
            Scale up, and back down
          </SplitTextReveal>
          <p className="mt-3 text-body">
            Work is rarely flat. Our minimum hire is {HIRE_TERMS.minHireDays} days; after that you
            can return a van on the notice set out in your rental agreement. So a van taken on for
            a busy quarter does not become a three-year commitment.
          </p>
          <p className="mt-3 text-body">
            If you need several vans at once, tell us how many and for roughly how long and we
            will work out what we can hold for you. Discounts apply at three months and again past
            six.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <SplitTextReveal className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
            Drivers and paperwork
          </SplitTextReveal>
          <p className="mt-3 text-body">
            Additional drivers can be approved, provided they meet our eligibility requirements and
            are added to the rental agreement before they drive. Every driver needs to be at least{" "}
            {HIRE_TERMS.minDriverAge}, hold a valid Australian licence, and have held it for at
            least {HIRE_TERMS.minLicenceMonths} months.
          </p>
          <p className="mt-3 text-body">
            For business hires we will usually also ask for the documents needed for insurance and
            business verification. Payment is by direct debit or another approved method, explained
            at booking.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <SplitTextReveal className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
            What every business hire includes
          </SplitTextReveal>
          <ul className="mt-4 space-y-2">
            {[
              "Comprehensive insurance, subject to the rental agreement",
              "Unlimited kilometres across the fleet",
              "24/7 roadside assistance",
              "Scheduled servicing and maintenance, handled by us",
              "A dedicated contact who knows your account",
              "GPS tracking",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-body">
                <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-body">
            Vans are approved for use within {HIRE_TERMS.stateOfUse}. If your work takes you across
            a border, talk to us first and we will arrange it properly rather than leaving you
            uninsured.
          </p>
        </AnimatedSection>
      </article>

      {suggested.length > 0 ? (
        <section aria-labelledby="suggested" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <AnimatedSection>
            <SplitTextReveal
              className="font-heading text-2xl font-bold tracking-tight text-foreground"
            >
              Larger vans for trade and freight
            </SplitTextReveal>
            <p className="mt-2 text-body">
              High-roof and long-wheelbase options for pallet work, stock runs and full fit-outs.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {suggested.map((v) => (
                <VanCard key={v.id} van={v} />
              ))}
            </div>
            <p className="mt-6">
              <Link
                href="/vans"
                className="font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                See the full fleet and dimensions →
              </Link>
            </p>
          </AnimatedSection>
        </section>
      ) : null}

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <AnimatedSection>
            <SplitTextReveal className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Business hire questions
            </SplitTextReveal>
            <div className="mt-6">
              <FaqList faqs={faqs} />
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <AnimatedSection>
            <SplitTextReveal className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Talk to us about your fleet
            </SplitTextReveal>
            <p className="mt-2 text-body">
              Tell us how many vans you need and for how long. We’ll come back with a rate.
            </p>
            <div className="mt-6">
              <EnquiryForm phone={contact.phone} />
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
