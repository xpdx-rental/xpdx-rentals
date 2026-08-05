import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getSiteContact } from "@/lib/data/settings";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { HIRE_TERMS } from "@/lib/business";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: "/service-area",
  title: "Service area — Sydney and NSW",
  description:
    "XPDX Rentals hires vans from Condell Park in south-west Sydney. Our vans are approved for use across New South Wales, with interstate travel by prior arrangement.",
});

/**
 * ⚠ NEWLY AUTHORED — needs client approval.
 *
 * The suburb list below is geography, not a business claim: these are areas
 * near the Condell Park yard. The page deliberately does not say we "service"
 * or "deliver to" any of them, because CLAUDE.md §3 authorises no delivery or
 * coverage claim — only that vans are approved for use within NSW, interstate
 * by prior arrangement.
 *
 * TODO(client): confirm whether vans can be delivered, and to where. If they
 * can, this page should say so, and it will be a strong local-SEO asset.
 */

/** Suburbs near the Condell Park yard, grouped by direction. Geography only. */
const NEARBY: { region: string; suburbs: string[] }[] = [
  {
    region: "Canterbury-Bankstown",
    suburbs: [
      "Condell Park", "Bankstown", "Yagoona", "Punchbowl", "Greenacre",
      "Chullora", "Padstow", "Revesby", "Panania", "Milperra",
    ],
  },
  {
    region: "South-west Sydney",
    suburbs: [
      "Liverpool", "Moorebank", "Chipping Norton", "Prestons", "Casula",
      "Fairfield", "Smithfield", "Wetherill Park", "Villawood", "Lansvale",
    ],
  },
  {
    region: "Inner west and south",
    suburbs: [
      "Strathfield", "Burwood", "Campsie", "Marrickville", "Rockdale",
      "Kogarah", "Hurstville", "Peakhurst", "Riverwood", "Beverly Hills",
    ],
  },
  {
    region: "Western Sydney",
    suburbs: [
      "Parramatta", "Auburn", "Silverwater", "Blacktown", "Rydalmere",
      "Seven Hills", "Girraween", "Merrylands", "Guildford", "Regents Park",
    ],
  },
];

export default async function ServiceAreaPage() {
  const contact = await getSiteContact();

  return (
    <>
      <JsonLd
        schema={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Service area", path: "/service-area" },
        ])}
      />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Where we hire from
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-body">
            Vans are collected from and returned to our yard at {contact.address}. Once you have
            the keys, they are approved for use across {HIRE_TERMS.stateOfUse}.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
            <MapPin className="size-5 text-link" aria-hidden="true" />
            Our yard
          </h2>
          <address className="mt-2 not-italic text-body">{contact.address}</address>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 font-semibold text-foreground hover:border-primary hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Get directions
          </a>
        </div>

        <section aria-labelledby="nearby" className="mt-12">
          <h2
            id="nearby"
            className="font-heading text-2xl font-bold tracking-tight text-foreground"
          >
            Easy to reach from
          </h2>
          <p className="mt-2 max-w-2xl text-body">
            We are a short drive from most of south-west and inner Sydney. These are the areas
            our customers most often travel from.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {NEARBY.map((group) => (
              <div key={group.region}>
                <h3 className="font-heading text-lg font-bold text-foreground">{group.region}</h3>
                <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-body">
                  {group.suburbs.map((s) => (
                    <li key={s} className="after:ml-3 after:text-border after:content-['·'] last:after:content-['']">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="interstate" className="mt-12 max-w-3xl">
          <h2
            id="interstate"
            className="font-heading text-2xl font-bold tracking-tight text-foreground"
          >
            Travelling outside NSW
          </h2>
          <p className="mt-3 text-body">
            Our vehicles are primarily approved for use within New South Wales. If you require
            interstate travel, please contact our team before booking to discuss your
            requirements — it is usually fine, but it needs arranging in advance so your cover is
            not affected.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            See{" "}
            <Link href="/faq#interstate" className="font-medium text-link hover:underline">
              can I take the vehicle interstate?
            </Link>
          </p>
        </section>
      </div>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Check availability
          </h2>
          <div className="mt-6">
            <EnquiryForm phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
