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
import { AnimatedSection } from "@/components/animations/animated-section";
import { SplitTextReveal } from "@/components/animations/split-text-reveal";
import { ALL_FAQS } from "@/lib/content/faqs";
import { HIRE_TERMS } from "@/lib/business";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: "/local-van-hire",
  title: "Local van hire, Condell Park",
  description:
    "Local van hire from our Condell Park yard, serving south-west and greater Sydney. Unlimited kilometres, in-house mechanic, 28 day minimum.",
});

/**
 * Service page 1 of 3 — CLAUDE.md §8: "The three service pages are the real
 * ranking assets. Each must be a genuine page with unique copy, its own H1,
 * its own meta, internal links to relevant vans and a form."
 *
 * ⚠ ALL PROSE ON THIS PAGE IS NEWLY AUTHORED and needs client approval.
 * `docs/content/supplied-copy.md` contains no copy for the service pages. It
 * is written in the client's register — plain, warm, first-person plural, no
 * hype — and states only facts authorised by CLAUDE.md §3. See
 * docs/conversion/02-phase4-report.md for the full list of authored copy.
 *
 * This page's angle: PROXIMITY AND PRACTICALITY — who we are near, how
 * collection works, why a local yard with its own mechanic beats a franchise
 * counter. It deliberately does not repeat the business-fleet or
 * courier/delivery angles of the other two.
 */

const FAQ_IDS = ["minimum-rental-period", "kilometre-limits", "who-can-rent", "servicing"];

export default async function LocalVanHirePage() {
  const [vans, contact] = await Promise.all([getPublicVans(), getSiteContact()]);
  const faqs = ALL_FAQS.filter((f) => FAQ_IDS.includes(f.id));
  // Smallest two vans: the ones a local, around-town hirer usually wants.
  const suggested = [...vans].sort((a, b) => a.tonnage - b.tonnage).slice(0, 3);

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Local van hire", path: "/local-van-hire" },
          ]),
          faqPageSchema(faqs),
        ]}
      />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          {/* Trust Badge */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 text-amber-500 fill-amber-500" />
              ))}
            </div>
            <span className="text-foreground/80 text-xs font-medium tracking-wide">
              <span className="font-bold text-foreground">5.0</span> average on Google
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <h1 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Local van hire in Sydney
            </h1>
            
            {/* Live Availability Indicator */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-1.5 sm:mb-2.5">
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider uppercase">
                Vans Available Today
              </span>
            </div>
          </div>
          
          <p className="mt-6 max-w-2xl text-lg text-body">
            Our yard is at {contact.address}. If you work anywhere across south-west or greater
            Sydney, you can collect a van in the morning and be on the job the same day.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <AnimatedSection>
          <SplitTextReveal className="font-heading text-2xl font-bold tracking-tight text-foreground">
            A yard, not a counter
          </SplitTextReveal>
          <p className="mt-3 text-body">
            We are a family-owned business running a small fleet from one location. That means the
            person who hands you the keys is the person who knows the van, and the mechanic who
            services it works here too. If something needs looking at, it does not go into a
            queue at a depot on the other side of the city.
          </p>
          <p className="mt-3 text-body">
            It also means we can be straight with you about what we have. If the van you want is
            out, we will say so and tell you when it is back, rather than moving you onto
            something that will not fit the job.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <SplitTextReveal className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
            How collection works
          </SplitTextReveal>
          <ol className="mt-4 space-y-3 text-body">
            <li className="flex gap-3">
              <span className="font-mono font-bold text-link">1.</span>
              <span>
                Send us an enquiry or call. Tell us what you are carrying and roughly how long you
                need the van.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono font-bold text-link">2.</span>
              <span>
                We confirm which van suits, the weekly rate, and what you need to bring — licence,
                proof of identity, and anything else required for insurance.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono font-bold text-link">3.</span>
              <span>
                Come to the yard, we walk around the van with you, and the security bond is settled
                before you take the keys.
              </span>
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Approvals are fast, but they are not instant — we still check licence and insurance
            requirements properly. See{" "}
            <Link href="/faq#who-can-rent" className="font-medium text-link hover:underline">
              who can rent a vehicle
            </Link>
            .
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <SplitTextReveal className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
            Hiring locally, long term
          </SplitTextReveal>
          <p className="mt-3 text-body">
            Our minimum hire is {HIRE_TERMS.minHireDays} days. That makes us a poor fit for a
            weekend move and a good fit if you need a van as part of how you work — a run you have
            just picked up, a contract for a few months, or a stand-in while your own vehicle is
            off the road.
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "Unlimited kilometres, so a busy week never costs more than a quiet one",
              "Comprehensive insurance included, subject to the rental agreement",
              "Servicing handled by us, not by you",
              "Discounts at three months and again past six",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-body">
                <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-body">
            If you need to cover a wider area, our vans are approved for use across{" "}
            {HIRE_TERMS.stateOfUse}. Interstate travel is possible by prior arrangement — talk to
            us before you book.
          </p>
        </AnimatedSection>
      </article>

      {suggested.length > 0 ? (
        <section aria-labelledby="suggested" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <AnimatedSection>
            <SplitTextReveal
              className="font-heading text-2xl font-bold tracking-tight text-foreground"
            >
              Good vans for local work
            </SplitTextReveal>
            <p className="mt-2 text-body">
              Easier to park, easier on fuel, and enough room for most around-town jobs.
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
                Compare the whole fleet →
              </Link>
            </p>
          </AnimatedSection>
        </section>
      ) : null}

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <AnimatedSection>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Questions we get asked locally
            </h2>
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
              Enquire about local hire
            </SplitTextReveal>
            <div className="mt-6">
              <EnquiryForm phone={contact.phone} />
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
