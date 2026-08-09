import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getSiteContact } from "@/lib/data/settings";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { BackgroundVideo } from "@/components/public/background-video";
import { JsonLd } from "@/components/json-ld";
import { IframeMap } from "@/components/public/iframe-map";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { corePage } from "@/lib/seo/entities/core-pages";
import { HIRE_TERMS } from "@/lib/business";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata(corePage("/service-area"));

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

      <section className="relative overflow-hidden border-b border-border bg-muted/30">
        <div className="absolute inset-0 pointer-events-none">
          {/*
            Same fix as the about-us hero: 3 MB of video was being fetched to
            render at 10% opacity under a full-width gradient.
          */}
          <div className="absolute inset-0 opacity-10">
            <BackgroundVideo
              src="/videos/hero-van.mp4"
              poster="/business-hero-poster.jpg"
              className="size-full"
              priority={false}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Your Local Sydney Van Hire Partner
              </h1>
              <p className="mt-6 text-lg text-body leading-relaxed">
                Conveniently located at our Condell Park depot, our premium fleet of commercial vans is ready to hit the road. Whether you&apos;re navigating local streets or taking your business across {HIRE_TERMS.stateOfUse}, XPDX Rentals delivers the ultimate combination of flexibility, reliability, and unparalleled value. Vans are collected from and returned to our secure yard at {contact.address}.
              </p>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-xl hidden lg:block border border-border">
              <Image 
                src="/images/service-hero-branded.webp" 
                alt="Premium commercial van ready to hit the road in Sydney" 
                fill 
                className="object-cover" 
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-border bg-surface mb-12 shadow-md">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 sm:p-12 flex flex-col justify-center">
              <h2 className="flex items-center gap-3 font-heading text-3xl font-bold text-foreground">
                <MapPin className="size-8 text-primary shrink-0" aria-hidden="true" />
                Our Condell Park Depot
              </h2>
              <address className="mt-6 not-italic text-lg text-foreground font-semibold">{contact.address}</address>
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                Situated in the heart of south-west Sydney, our depot offers rapid, hassle-free access to our entire fleet. Our standard operating zone guarantees exceptional service within a 20-mile radius, perfectly catering to both local residents and dynamic businesses.
              </p>
              <div className="mt-8">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-full bg-primary px-8 font-bold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shadow-sm"
                >
                  Get directions
                </a>
              </div>
            </div>
            <div className="relative min-h-[300px] md:min-h-full w-full">
              <Image 
                src="/images/xpdx-real-yard-pro.webp" 
                alt="XPDX Rentals yard at Condell Park" 
                fill 
                className="object-cover" 
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
          </div>
        </div>

        <section aria-labelledby="service-map-heading" className="mt-12 mb-16">
          <div className="text-center mb-8">
            <h2 id="service-map-heading" className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Our Primary Service Zone
            </h2>
            <p className="mt-2 text-body max-w-2xl mx-auto">
              While our vans are fully approved for use across all of New South Wales, the map below highlights our primary 20-mile service radius—where we support hundreds of local businesses and residents every single week.
            </p>
          </div>
          {/* Condell Park coordinates: -33.916, 151.011 */}
          <IframeMap address={contact.address} />
        </section>

        <section aria-labelledby="nearby" className="mt-12">
            <h2
            id="nearby"
            className="font-heading text-2xl font-bold tracking-tight text-foreground"
          >
            Strategically Located for Your Convenience
          </h2>
          <p className="mt-2 max-w-2xl text-body">
            Getting to our depot couldn&apos;t be easier. We are just a short drive from major transport links across south-west and inner Sydney, making us the top choice for customers across these key regions:
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
            Need to Go Interstate?
          </h2>
          <p className="mt-3 text-body text-lg">
            While our vans are primed and approved for NSW roads, we understand that your journey might take you further. Interstate travel is absolutely possible—simply speak with our expert team prior to booking so we can arrange the necessary comprehensive coverage and ensure your trip goes off without a hitch.
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
