import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { FAQ_GROUPS, ALL_FAQS, FAQ_CLOSING } from "@/lib/content/faqs";
import { JsonLd } from "@/components/json-ld";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { corePage } from "@/lib/seo/entities/core-pages";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata(corePage("/faq"));

const GROUP_ICONS: Record<string, string> = {
  "your-rental": "📦",
  "eligibility-and-drivers": "🪪",
  "on-the-road": "🛣️",
  "business-and-payment": "💼",
};

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

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[50vw] h-[40vh] bg-[#EA580C]/[0.06] blur-[100px] -translate-x-1/4 -translate-y-1/4 rounded-full" />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-[#EA580C]" />
            <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">FAQ</span>
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Got questions?<br />
            <span className="text-[#EA580C]">We&apos;ve got answers.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/50 leading-relaxed">
            Bond, insurance, eligibility and what happens on the road — everything you need to know
            before hiring a van.
          </p>

          {/* Section jump nav */}
          <nav aria-label="FAQ sections" className="mt-8 flex flex-wrap gap-3">
            {FAQ_GROUPS.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/60 hover:border-[#EA580C]/40 hover:text-white transition-all duration-200 backdrop-blur-sm"
              >
                <span aria-hidden="true">{GROUP_ICONS[g.id]}</span>
                {g.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ── FAQ Groups ── */}
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[240px_1fr] gap-12 lg:gap-16 items-start">

            {/* Sticky sidebar nav (desktop) */}
            <nav
              aria-label="FAQ category navigation"
              className="hidden lg:block sticky top-28 space-y-1"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 px-3">
                Categories
              </p>
              {FAQ_GROUPS.map((g) => (
                <a
                  key={g.id}
                  href={`#${g.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/50 hover:bg-white/[0.05] hover:text-white transition-all duration-150 group"
                >
                  <span className="text-base" aria-hidden="true">{GROUP_ICONS[g.id]}</span>
                  <span>{g.title}</span>
                  <ArrowRight className="size-3.5 ml-auto opacity-0 group-hover:opacity-100 text-[#EA580C] transition-opacity" />
                </a>
              ))}

              <div className="mt-8 rounded-2xl border border-[#EA580C]/20 bg-[#EA580C]/[0.06] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#EA580C] mb-2">
                  Still unsure?
                </p>
                <p className="text-xs text-white/50 leading-relaxed mb-3">
                  Our team responds same-day.
                </p>
                <Link
                  href="/contact-us"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EA580C] hover:underline"
                >
                  Contact us <ArrowRight className="size-3" />
                </Link>
              </div>
            </nav>

            {/* Main FAQ content */}
            <div className="space-y-16">
              {FAQ_GROUPS.map((group) => (
                <section
                  key={group.id}
                  id={group.id}
                  aria-labelledby={`${group.id}-heading`}
                  className="scroll-mt-28"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-2xl" aria-hidden="true">{GROUP_ICONS[group.id]}</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EA580C] mb-0.5">
                        Section
                      </p>
                      <h2
                        id={`${group.id}-heading`}
                        className="font-heading text-2xl font-black text-white tracking-tight"
                      >
                        {group.title}
                      </h2>
                    </div>
                  </div>

                  {/* Restyled FAQ list wrapper */}
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.06]">
                    {group.faqs.map((faq, i) => (
                      <details
                        key={faq.id}
                        id={faq.id}
                        className="group"
                      >
                        <summary className="flex cursor-pointer select-none items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-white/80 hover:text-white hover:bg-white/[0.03] transition-colors [&::-webkit-details-marker]:hidden">
                          <span className="flex items-center gap-3">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/15 text-[#EA580C] text-xs font-bold font-mono shrink-0">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {faq.question}
                          </span>
                          <span className="size-6 rounded-full border border-white/10 flex items-center justify-center shrink-0 group-open:bg-[#EA580C]/10 group-open:border-[#EA580C]/30 transition-colors">
                            <svg className="size-3 text-white/40 group-open:text-[#EA580C] group-open:rotate-180 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </summary>
                        <div className="px-6 pb-5 pt-1 text-white/50 text-sm leading-relaxed space-y-3 border-t border-white/[0.04]">
                          {faq.answer.map((block, bi) => {
                            if (block.kind === "p")
                              return <p key={bi}>{block.text}</p>;
                            if (block.kind === "ul")
                              return (
                                <ul key={bi} className="space-y-1.5 ml-1">
                                  {block.items.map((item) => (
                                    <li key={item} className="flex items-start gap-2.5">
                                      <span className="mt-2 size-1.5 rounded-full bg-[#EA580C] shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              );
                            return (
                              <ol key={bi} className="space-y-2 ml-1">
                                {block.items.map((item, ii) => (
                                  <li key={item} className="flex items-start gap-3">
                                    <span className="flex size-5 items-center justify-center rounded-full bg-[#EA580C]/10 text-[#EA580C] text-[10px] font-bold shrink-0 mt-0.5">
                                      {ii + 1}
                                    </span>
                                    {item}
                                  </li>
                                ))}
                              </ol>
                            );
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="relative bg-muted border-t border-white/[0.06] py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#EA580C]/[0.07] blur-[80px] rounded-full" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#EA580C]/10 border border-[#EA580C]/20 mb-6">
            <WhatsAppIcon className="size-7 text-[#EA580C]" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight">
            Still have a question?
          </h2>
          <p className="mt-4 text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
            {FAQ_CLOSING}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              Contact us <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/vans"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-3.5 text-sm font-semibold text-white/60 hover:border-white/25 hover:text-white transition-colors"
            >
              Browse the fleet
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
