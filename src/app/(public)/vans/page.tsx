import type { Metadata } from "next";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSiteContact } from "@/lib/data/settings";
import { VanCard } from "@/components/public/van-card";
import { FleetLineLazy, LoadMatcherLazy } from "@/components/fleet/fleet-visuals";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { JsonLd } from "@/components/json-ld";
import { itemListSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { HIRE_TERMS, INCLUSIONS } from "@/lib/business";
import { formatMm, formatWeekly, ROOF_LABELS } from "@/lib/van";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  path: "/vans",
  title: "Our van fleet — HiAce and Sprinter hire",
  description:
    "Compare our cargo vans by size and weekly rate. Automatic diesel HiAce and Sprinter vans, with unlimited kilometres and insurance included.",
});

export default async function VansPage() {
  const [vans, contact] = await Promise.all([getPublicVans(), getSiteContact()]);

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Our fleet", path: "/vans" },
          ]),
          ...(vans.length ? [itemListSchema(vans)] : []),
        ]}
      />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Our fleet
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-body">
            Every van is automatic, diesel, and fitted out for cargo with a bulkhead, reverse
            camera and GPS tracking. Rates are per week, with a {HIRE_TERMS.minHireDays} day
            minimum hire.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-body">
            {INCLUSIONS.map((i) => (
              <li key={i} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {vans.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Our fleet is not available to browse right now. Please call us and we’ll talk you
            through what’s available.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vans.map((v, i) => (
                <VanCard key={v.id} van={v} priority={i < 3} />
              ))}
            </div>

            {/*
              Size guide. A true-to-scale comparison is the single most useful
              thing on this page — a customer can see that a Sprinter SWB is
              about the same length as a HiAce LWB but much taller, which is
              exactly the mistake people make when booking. Phase 4b replaces
              this table with the FleetLine drawing (MOTION.md §4.1); the table
              stays underneath it as the accessible, no-JS version.
            */}
            <section aria-labelledby="size-guide" className="mt-16">
              <h2
                id="size-guide"
                className="font-heading text-2xl font-bold tracking-tight text-foreground"
              >
                Size guide
              </h2>
              <p className="mt-2 text-body">
                Drawn to scale, so you can compare them honestly. All measurements are external;
                load volume and payload are confirmed on request.
              </p>

              {/*
                The Fleet Line (MOTION.md §4.1). The table below is not a
                fallback — it is the accessible, no-JavaScript version of the
                same data, and it stays.
              */}
              <div className="mt-8">
                <FleetLineLazy
                  vans={vans.map((v) => ({
                    slug: v.slug,
                    name: v.name,
                    lengthMm: v.lengthMm,
                    heightMm: v.heightMm,
                    wheelbaseMm: v.wheelbaseMm,
                    priceWeeklyFrom: v.priceWeeklyFrom,
                    bodyType: v.bodyType,
                  }))}
                />
              </div>
              <div className="mt-6 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[38rem] text-left text-sm">
                  <caption className="sr-only">
                    Van dimensions and weekly rates, smallest first
                  </caption>
                  <thead className="border-b border-border bg-muted/50 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="p-3">Van</th>
                      <th scope="col" className="p-3">Roof</th>
                      <th scope="col" className="p-3">Length</th>
                      <th scope="col" className="p-3">Height</th>
                      <th scope="col" className="p-3">Tonnage</th>
                      <th scope="col" className="p-3">From</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {vans.map((v) => (
                      <tr key={v.id} className="border-b border-border last:border-0">
                        <th scope="row" className="p-3 font-sans font-medium text-foreground">
                          {v.name}
                        </th>
                        <td className="p-3 text-body">{ROOF_LABELS[v.roof]}</td>
                        <td className="p-3 tabular-nums text-body">{formatMm(v.lengthMm)}</td>
                        <td className="p-3 tabular-nums text-body">{formatMm(v.heightMm)}</td>
                        <td className="p-3 tabular-nums text-body">{v.tonnage}t</td>
                        <td className="p-3 tabular-nums text-foreground">
                          {formatWeekly(v.priceWeeklyFrom)}/wk
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>

      {vans.length > 0 ? (
        <section aria-labelledby="load-matcher" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2
            id="load-matcher"
            className="font-heading text-2xl font-bold tracking-tight text-foreground"
          >
            Will it fit?
          </h2>
          <p className="mt-2 max-w-2xl text-body">
            Pick what you are moving and see it load into each van.
          </p>
          <div className="mt-6">
            <LoadMatcherLazy
              vans={vans.map((v) => ({
                slug: v.slug,
                name: v.name,
                lengthMm: v.lengthMm,
                heightMm: v.heightMm,
                wheelbaseMm: v.wheelbaseMm,
                priceWeeklyFrom: v.priceWeeklyFrom,
              }))}
            />
          </div>
        </section>
      ) : null}

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Not sure which van you need?
          </h2>
          <p className="mt-2 text-body">
            Tell us what you’re carrying and we’ll point you at the right one.
          </p>
          <div className="mt-6">
            <EnquiryForm phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
