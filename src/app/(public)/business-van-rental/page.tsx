import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact } from "@/lib/data/settings";
import { VanCard } from "@/components/public/van-card";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { FaqList } from "@/components/public/faq-list";
import { JsonLd } from "@/components/json-ld";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { ALL_FAQS } from "@/lib/content/faqs";
import { HIRE_TERMS } from "@/lib/business";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: "/business-van-rental",
  title: "Business van rental in NSW",
  description:
    "Commercial van rental for NSW businesses. One van or a whole fleet, with maintenance, insurance and support included. 28 day minimum hire.",
});

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

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Business van rental
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-body">
            One van or a whole fleet, on terms that flex with the work. Maintenance, insurance
            and support are part of the hire, not extras you manage separately.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          One predictable weekly cost
        </h2>
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

        <h2 className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
          Scale up, and back down
        </h2>
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

        <h2 className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
          Drivers and paperwork
        </h2>
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

        <h2 className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
          What every business hire includes
        </h2>
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
      </article>

      {suggested.length > 0 ? (
        <section aria-labelledby="suggested" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2
            id="suggested"
            className="font-heading text-2xl font-bold tracking-tight text-foreground"
          >
            Larger vans for trade and freight
          </h2>
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
        </section>
      ) : null}

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Business hire questions
          </h2>
          <div className="mt-6">
            <FaqList faqs={faqs} />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Talk to us about your fleet
          </h2>
          <p className="mt-2 text-body">
            Tell us how many vans you need and for how long. We’ll come back with a rate.
          </p>
          <div className="mt-6">
            <EnquiryForm phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
