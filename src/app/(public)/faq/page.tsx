import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_GROUPS, ALL_FAQS, FAQ_CLOSING } from "@/lib/content/faqs";
import { FaqList } from "@/components/public/faq-list";
import { JsonLd } from "@/components/json-ld";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: "/faq",
  title: "Van hire FAQ — bond, insurance, eligibility",
  description:
    "Bond, insurance, minimum hire period, kilometre limits, who can rent, servicing and payment. Everything you need to know before hiring a van from XPDX Rentals.",
});

/**
 * The full FAQ. All eighteen supplied questions, verbatim and unabridged,
 * grouped exactly as CLAUDE.md §8 specifies:
 * Your rental · Eligibility and drivers · On the road · Business and payment.
 *
 * `FAQPage` markup carries the full set here because the full set is visible
 * here — the home page carries only its six.
 */
export default function FaqPage() {
  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          faqPageSchema(ALL_FAQS),
        ]}
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-lg text-body">
          Bond, insurance, eligibility and what happens on the road.
        </p>

        <nav aria-label="FAQ sections" className="mt-8 flex flex-wrap gap-2">
          {FAQ_GROUPS.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-body hover:border-primary hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {g.title}
            </a>
          ))}
        </nav>

        <div className="mt-10 space-y-12">
          {FAQ_GROUPS.map((group) => (
            <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`}>
              <h2
                id={`${group.id}-heading`}
                className="font-heading text-2xl font-bold tracking-tight text-foreground"
              >
                {group.title}
              </h2>
              <div className="mt-4">
                <FaqList faqs={group.faqs} />
              </div>
            </section>
          ))}
        </div>

        <section aria-labelledby="still-have-a-question" className="mt-14 rounded-xl border border-border bg-muted/30 p-6">
          <h2
            id="still-have-a-question"
            className="font-heading text-xl font-bold tracking-tight text-foreground"
          >
            Still have a question?
          </h2>
          <p className="mt-2 text-body">{FAQ_CLOSING}</p>
          <Link
            href="/contact-us"
            className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-primary px-5 font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Contact us
          </Link>
        </section>
      </div>
    </>
  );
}
