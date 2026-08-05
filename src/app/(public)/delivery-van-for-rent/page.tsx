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
import { formatMm, formatWeekly } from "@/lib/van";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: "/delivery-van-for-rent",
  title: "Delivery van for rent — unlimited km",
  description:
    "Courier and delivery van hire in Sydney with genuinely unlimited kilometres. Automatic diesel vans, insurance and 24/7 roadside assistance included.",
});

/**
 * Service page 2 of 3.
 *
 * ⚠ ALL PROSE ON THIS PAGE IS NEWLY AUTHORED and needs client approval —
 * `docs/content/supplied-copy.md` has no service-page copy. Written in the
 * client's register and using only facts authorised by CLAUDE.md §3.
 *
 * This page's angle: THE ECONOMICS OF A COURIER ROUND — unlimited kilometres
 * as the actual differentiator (most competitors cap it), uptime, and what
 * happens when a van breaks down mid-round. Deliberately does not repeat the
 * proximity angle of /local-van-hire or the fleet/account angle of
 * /business-van-rental.
 */

const FAQ_IDS = ["kilometre-limits", "commercial-use", "breakdown", "fuel"];

export default async function DeliveryVanForRentPage() {
  const [vans, contact] = await Promise.all([getPublicVans(), getSiteContact()]);
  const faqs = ALL_FAQS.filter((f) => FAQ_IDS.includes(f.id));
  const cheapest = vans.length
    ? [...vans].sort((a, b) => a.priceWeeklyFrom - b.priceWeeklyFrom)[0]
    : null;
  // Mid-size vans: the usual courier choice.
  const suggested = [...vans].sort((a, b) => a.tonnage - b.tonnage).slice(1, 4);

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Delivery van for rent", path: "/delivery-van-for-rent" },
          ]),
          faqPageSchema(faqs),
        ]}
      />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Delivery van for rent
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-body">
            Built for courier rounds and delivery work: automatic diesel vans with genuinely
            unlimited kilometres, so the more you drive, the better the deal gets.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Unlimited kilometres, and we mean it
        </h2>
        <p className="mt-3 text-body">
          Most van rental in Australia comes with a kilometre cap and an excess charge once you
          pass it. For a courier that is the single most expensive line in the contract, because
          the whole job is distance. Ours has no cap and no excess-kilometre charge.
        </p>
        <p className="mt-3 text-body">
          It also makes your costs predictable. A week where you pick up extra drops costs the
          same as a quiet one, so you can quote work without doing arithmetic about the van
          first.
        </p>

        <h2 className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
          Downtime is the real cost
        </h2>
        <p className="mt-3 text-body">
          If you deliver for a living, a van off the road is not an inconvenience, it is a day
          you do not get paid for. Every hire includes 24/7 roadside assistance, and servicing
          is scheduled and handled by us — you do not book it, and you do not pay for it
          separately.
        </p>
        <p className="mt-3 text-body">
          Repairs and servicing during your hire go to one of our authorised mechanics, which
          includes our own in-house workshop. That is how we keep the standard consistent and
          the turnaround short.
        </p>

        <h2 className="mt-10 font-heading text-2xl font-bold tracking-tight text-foreground">
          Fitted out for the work
        </h2>
        <ul className="mt-4 space-y-2">
          {[
            "Cargo fit-out with a bulkhead behind the cab",
            "Reverse camera — worth having on a tight residential round",
            "Automatic transmission, which matters over a long day of stop-start",
            "GPS tracked",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-body">
              <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-body">
          Fuel is simple: return the van at the level it was supplied. Refuelling charges only
          apply if it comes back lower.
        </p>

        {cheapest ? (
          <p className="mt-8 rounded-xl border border-border bg-muted/30 p-5 text-body">
            Courier-suitable vans start at{" "}
            <strong className="font-mono tabular-nums text-foreground">
              {formatWeekly(cheapest.priceWeeklyFrom)}
            </strong>{" "}
            per week
            {cheapest.lengthMm ? (
              <>
                {" "}
                — the {cheapest.name}, {formatMm(cheapest.lengthMm)} long
              </>
            ) : null}
            .
          </p>
        ) : null}
      </article>

      {suggested.length > 0 ? (
        <section aria-labelledby="suggested" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2
            id="suggested"
            className="font-heading text-2xl font-bold tracking-tight text-foreground"
          >
            Popular with courier drivers
          </h2>
          <p className="mt-2 text-body">
            Enough capacity for a full round without becoming awkward in traffic.
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
              Compare every van by size and rate →
            </Link>
          </p>
        </section>
      ) : null}

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Courier and delivery questions
          </h2>
          <div className="mt-6">
            <FaqList faqs={faqs} />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Enquire about a delivery van
          </h2>
          <div className="mt-6">
            <EnquiryForm phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
