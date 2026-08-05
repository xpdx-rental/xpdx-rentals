import type { Metadata } from "next";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { getSiteContact, getOpeningHours } from "@/lib/data/settings";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, autoRentalSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { telHref, waHref } from "@/lib/lead";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: "/contact-us",
  // The root layout appends "| XPDX Rentals", so the brand must not
  // appear here too — it rendered as "…XPDX Rentals, Condell Park | XPDX
  // Rentals" in the tab and the SERP.
  title: "Contact us — our yard at Condell Park",
  description:
    "Call, message or email XPDX Rentals. Our yard is at 16 Ilma Street, Condell Park NSW 2200. Send an enquiry and we'll come back to you quickly.",
});

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default async function ContactUsPage() {
  const [contact, hours] = await Promise.all([getSiteContact(), getOpeningHours()]);
  const hasHours = Object.keys(hours).length > 0;

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact us", path: "/contact-us" },
          ]),
          autoRentalSchema(contact, hours),
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Contact us
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-body">
          The quickest way to get an answer is to call. If we’re with a customer, send an enquiry
          and we’ll come straight back to you.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-xl font-bold text-foreground">Get in touch</h2>
              <ul className="mt-4 space-y-4">
                {contact.phone ? (
                  <li>
                    <a
                      href={telHref(contact.phone)}
                      className="flex min-h-11 items-center gap-3 font-semibold text-foreground hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <Phone className="size-5 text-link" aria-hidden="true" />
                      {contact.phone}
                    </a>
                  </li>
                ) : null}
                {contact.whatsapp ? (
                  <li>
                    <a
                      href={waHref(contact.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center gap-3 font-semibold text-foreground hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <MessageCircle className="size-5 text-link" aria-hidden="true" />
                      Message us on WhatsApp
                    </a>
                  </li>
                ) : null}
                {contact.email ? (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex min-h-11 items-center gap-3 break-all font-semibold text-foreground hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <Mail className="size-5 shrink-0 text-link" aria-hidden="true" />
                      {contact.email}
                    </a>
                  </li>
                ) : null}
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
                  <div>
                    <address className="not-italic text-body">{contact.address}</address>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm font-medium text-link hover:underline"
                    >
                      Get directions
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
                <Clock className="size-5 text-link" aria-hidden="true" />
                Opening hours
              </h2>
              {hasHours ? (
                <dl className="mt-4 space-y-1.5 text-sm">
                  {DAY_ORDER.filter((d) => hours[d]).map((d) => (
                    <div key={d} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{DAY_LABELS[d]}</dt>
                      <dd className="text-body">{hours[d]}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                // TODO(client): opening hours are not in CLAUDE.md §3.
                <p className="mt-3 text-sm text-body">
                  Please call to confirm our opening hours before visiting the yard.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Send us an enquiry
            </h2>
            <p className="mt-2 text-body">
              Tell us what you need and when, and we’ll get back to you.
            </p>
            <div className="mt-6">
              <EnquiryForm phone={contact.phone} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
