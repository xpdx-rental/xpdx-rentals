import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, ArrowRight, Zap } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { getSiteContact, getOpeningHours } from "@/lib/data/settings";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { IframeMap } from "@/components/public/iframe-map";

import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, autoRentalSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { corePage } from "@/lib/seo/entities/core-pages";
import { telHref, waHref } from "@/lib/lead";

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata(corePage("/contact-us"));

const DAY_LABELS: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday",
  thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
};
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const QUICK_FACTS = [
  { icon: Zap, label: "Fast response", text: "Usually same business day" },
  { icon: MapPin, label: "Our yard", text: "Condell Park NSW 2200" },
  { icon: Clock, label: "Support", text: "24/7 roadside assistance" },
];

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

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[55vw] h-[55vh] bg-[#EA580C]/[0.07] blur-[120px] translate-x-1/4 -translate-y-1/4 rounded-full" />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-[#EA580C]" />
            <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">Contact</span>
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-black tracking-tight text-foreground leading-tight">
            Let&apos;s talk.<br />
            <span className="text-[#EA580C]">We&apos;re ready.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground leading-relaxed">
            The quickest way to get an answer is to call. If we&apos;re with a customer,
            leave a message and we&apos;ll come back to you fast.
          </p>

          {/* Quick facts row */}
          <div className="mt-10 flex flex-wrap gap-4">
            {QUICK_FACTS.map(({ icon: Icon, label, text }) => (
              <div key={label} className="flex items-center gap-3 rounded-full border border-border bg-muted px-4 py-2.5 backdrop-blur-sm">
                <Icon className="size-4 text-[#EA580C] shrink-0" />
                <div className="text-sm">
                  <span className="text-muted-foreground">{label}: </span>
                  <span className="text-foreground font-semibold">{text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[380px_1fr] gap-10 lg:gap-16 items-start">

            {/* ── Left: Contact info ── */}
            <div className="space-y-5 lg:sticky lg:top-28">

              {/* Direct contact cards */}
              <div className="rounded-2xl border border-border bg-muted overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Get in touch</p>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {contact.phone && (
                    <a
                      href={telHref(contact.phone)}
                      className="flex items-center gap-4 px-5 py-4 group hover:bg-muted transition-colors"
                    >
                      <div className="flex size-10 items-center justify-center rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/20 shrink-0 group-hover:bg-[#EA580C]/15 transition-colors">
                        <Phone className="size-4 text-[#EA580C]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Call us</p>
                        <p className="font-semibold text-foreground text-sm">{contact.phone}</p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-[#EA580C] group-hover:translate-x-0.5 transition-all" />
                    </a>
                  )}

                  {contact.whatsapp && (
                    <a
                      href={waHref(contact.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 px-5 py-4 group hover:bg-muted transition-colors"
                    >
                      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                        <WhatsAppIcon className="size-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">WhatsApp</p>
                        <p className="font-semibold text-foreground text-sm">Message us</p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </a>
                  )}

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-4 px-5 py-4 group hover:bg-muted transition-colors"
                    >
                      <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0 group-hover:bg-blue-500/15 transition-colors">
                        <Mail className="size-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Email</p>
                        <p className="font-semibold text-foreground text-sm truncate">{contact.email}</p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </a>
                  )}

                  <div className="flex items-start gap-4 px-5 py-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                      <MapPin className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Our yard</p>
                      <address className="not-italic font-semibold text-foreground text-sm leading-snug">
                        {contact.address}
                      </address>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Get directions <ArrowRight className="size-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opening hours */}
              <div className="rounded-2xl border border-border bg-muted overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                  <Clock className="size-4 text-[#EA580C]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Opening hours</p>
                </div>
                <div className="px-5 py-4">
                  {hasHours ? (
                    <dl className="space-y-2">
                      {DAY_ORDER.filter((d) => hours[d]).map((d) => (
                        <div key={d} className="flex justify-between gap-4 text-sm">
                          <dt className="text-muted-foreground font-mono">{DAY_LABELS[d]}</dt>
                          <dd className="text-foreground font-semibold">{hours[d]}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Please call to confirm our opening hours before visiting the yard.
                    </p>
                  )}
                </div>
              </div>

              {/*
                The yard, on the same Leaflet map the footer, /service-area and
                /local-van-hire use.

                This was a `maps.google.com/maps?…&output=embed` iframe, and it
                had to change for two reasons. It was the last consumer of the
                `maps.google.com` and `www.google.com` entries in `frame-src`,
                which were removed from the CSP along with the Google Maps JS
                API — so it would have rendered as a blocked, empty box. And it
                is a third-party frame that sets Google cookies, on the page
                whose entire purpose is collecting a customer's name, phone and
                email; the enquiry form's own consent copy does not cover it.

                The address is hardcoded here no longer either — `ADDRESS`/`GEO`
                in lib/business are the single source for where the yard is.
              */}
              <div className="rounded-2xl border border-border bg-muted overflow-hidden aspect-[4/3] relative">
                <IframeMap
                  address={contact.address}
                  className="size-full"
                />
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/[0.07] rounded-2xl" />
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Get directions &rarr;
              </a>
            </div>

            {/* ── Right: Enquiry form ── */}
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-[#EA580C]" />
                  <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">Enquiry</span>
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                  Send us a message
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Tell us what you need and when. We&apos;ll get back to you — usually same business day.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-muted backdrop-blur-sm p-7 sm:p-9">
                <EnquiryForm phone={contact.phone} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
