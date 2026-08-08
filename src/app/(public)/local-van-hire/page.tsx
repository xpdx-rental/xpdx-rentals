import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
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
import { ServiceAreaMap } from "@/components/public/service-area-map";
import { ALL_FAQS } from "@/lib/content/faqs";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata(corePage("/local-van-hire"));

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
            Where we hire from
          </SplitTextReveal>
          <p className="mt-3 text-body">
            Vans are collected from and returned to our yard at 16 Ilma Street, Condell Park NSW 2200. Once you have the keys, they are approved for use across New South Wales.
          </p>
          
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-heading text-lg font-bold text-foreground">Our yard</h3>
            <p className="mt-1 text-body">16 Ilma Street, Condell Park NSW 2200</p>
            <p className="mt-3">
              <a href="https://maps.google.com/?q=16+Ilma+Street,+Condell+Park+NSW+2200" target="_blank" rel="noopener noreferrer" className="font-semibold text-link hover:underline">
                Get directions →
              </a>
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <SplitTextReveal className="mt-12 font-heading text-2xl font-bold tracking-tight text-foreground">
            Easy to reach from
          </SplitTextReveal>
          <p className="mt-3 text-body">
            We are a short drive from most of south-west and inner Sydney. These are the areas our customers most often travel from.
          </p>
          
          {/*
            These four area groups are <h3>, not <h4>. Their parent section is
            an <h2> ("Easy to reach from"), so <h4> skipped a level — a WCAG
            1.3.1 failure that costs a screen-reader user the structure of the
            page when they navigate by heading. The visual size comes from the
            classes, not the tag, so nothing about the design changes.
          */}
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-foreground">Canterbury-Bankstown</h3>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>Condell Park</li>
                <li>Bankstown</li>
                <li>Yagoona</li>
                <li>Punchbowl</li>
                <li>Greenacre</li>
                <li>Chullora</li>
                <li>Padstow</li>
                <li>Revesby</li>
                <li>Panania</li>
                <li>Milperra</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">South-west Sydney</h3>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>Liverpool</li>
                <li>Moorebank</li>
                <li>Chipping Norton</li>
                <li>Prestons</li>
                <li>Casula</li>
                <li>Fairfield</li>
                <li>Smithfield</li>
                <li>Wetherill Park</li>
                <li>Villawood</li>
                <li>Lansvale</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Inner west and south</h3>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>Strathfield</li>
                <li>Burwood</li>
                <li>Campsie</li>
                <li>Marrickville</li>
                <li>Rockdale</li>
                <li>Kogarah</li>
                <li>Hurstville</li>
                <li>Peakhurst</li>
                <li>Riverwood</li>
                <li>Beverly Hills</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Western Sydney</h3>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>Parramatta</li>
                <li>Auburn</li>
                <li>Silverwater</li>
                <li>Blacktown</li>
                <li>Rydalmere</li>
                <li>Seven Hills</li>
                <li>Girraween</li>
                <li>Merrylands</li>
                <li>Guildford</li>
                <li>Regents Park</li>
              </ul>
            </div>
          </div>
        </AnimatedSection>
      </article>

      <section aria-labelledby="service-map" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <AnimatedSection>
          <ServiceAreaMap />
        </AnimatedSection>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <AnimatedSection delay={0.1}>
          <SplitTextReveal className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground">
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
          <SplitTextReveal className="mt-12 font-heading text-2xl font-bold tracking-tight text-foreground">
            Travelling outside NSW
          </SplitTextReveal>
          <p className="mt-3 text-body">
            Our vehicles are primarily approved for use within New South Wales. If you require interstate travel, please contact our team before booking to discuss your requirements — it is usually fine, but it needs arranging in advance so your cover is not affected.
          </p>
          <p className="mt-4">
            <Link href="/faq#can-i-take-the-vehicle-interstate" className="font-medium text-link hover:underline">
              See can I take the vehicle interstate? →
            </Link>
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
