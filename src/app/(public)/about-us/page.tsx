import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ABOUT_US, OUR_MISSION, ADVANTAGES } from "@/lib/content/about";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { getSiteContact } from "@/lib/data/settings";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: "/about-us",
  title: "About us — family-owned van hire",
  description:
    "XPDX Rentals is a family-owned commercial vehicle rental business in Condell Park, Sydney. Who we are, our mission, and what every hire includes.",
});

/**
 * About Us and Our Mission are rendered verbatim from
 * `docs/content/supplied-copy.md` via `lib/content/about.ts`.
 *
 * The headings and layout are ours; every sentence is the client's. The only
 * newly-authored words on this page are the two section headings, which are
 * the client's own titles.
 */
export default async function AboutUsPage() {
  const contact = await getSiteContact();

  return (
    <>
      <JsonLd
        schema={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About us", path: "/about-us" },
        ])}
      />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          About Us
        </h1>
        <div className="mt-6 space-y-5 text-lg leading-relaxed text-body">
          {ABOUT_US.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <h2 className="mt-14 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Our Mission
        </h2>
        <div className="mt-5 space-y-5 text-lg leading-relaxed text-body">
          {OUR_MISSION.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <h2 className="mt-14 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Our competitive advantages
        </h2>
        <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {ADVANTAGES.map((a) => (
            <li key={a.label} className="flex items-start gap-3">
              <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
              <span className="font-medium text-foreground">{a.label}</span>
            </li>
          ))}
        </ul>
      </article>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Talk to our team
          </h2>
          <div className="mt-6">
            <EnquiryForm phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
