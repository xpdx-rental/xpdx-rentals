import type { Metadata } from "next";
import {
  Shield, Infinity, Phone, Wrench, Calendar, Zap,
  Users, Tag, Headphones, Cog, ArrowRight, MapPin, Star,
  type LucideIcon,
} from "lucide-react";
import { ABOUT_US, OUR_MISSION, ADVANTAGES } from "@/lib/content/about";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { BackgroundVideo } from "@/components/public/background-video";
import Image from "next/image";
import { getSiteContact } from "@/lib/data/settings";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { corePage } from "@/lib/seo/entities/core-pages";

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata(corePage("/about-us"));

/**
 * `LucideIcon`, not `React.ElementType`. `ElementType` is a union over every
 * intrinsic tag, so TypeScript intersects their prop types when the value is
 * rendered as `<Icon className="…" />` and resolves `className` to `never`.
 * These are all lucide icons; saying so keeps the props checked instead of
 * needing an `as any` at the call site. `src/app/(public)/page.tsx` types its
 * equivalent map the same way.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  infinity: Infinity,
  shield: Shield,
  phone: Phone,
  wrench: Wrench,
  calendar: Calendar,
  zap: Zap,
  users: Users,
  tag: Tag,
  headset: Headphones,
  cog: Cog,
};

const STATS = [
  { value: "500+", label: "Happy customers" },
  { value: "28", label: "Day minimum hire" },
  { value: "24/7", label: "Roadside support" },
  { value: "100%", label: "Insured fleet" },
];

const VALUES = [
  { icon: Shield, title: "Integrity", text: "We never overpromise. Every term is clear before you sign." },
  { icon: Star, title: "Reliability", text: "Every van is serviced, inspected, and road-ready before collection." },
  { icon: Users, title: "Family Values", text: "Family-owned and operated — we treat every customer like one of our own." },
  { icon: Zap, title: "Support", text: "Real people, real answers. We pick up the phone." },
];

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

      {/* ── Cinematic Hero ── */}
      <section className="relative min-h-[55vh] flex items-center overflow-hidden bg-background">
        {/* Ambient gradients & background video */}
        <div className="absolute inset-0 pointer-events-none">
          {/*
            Was a bare autoplaying <video> with no poster and no preload hint:
            3 MB fetched at high priority to render at 30% opacity behind a
            70%-opaque scrim. Deferred behind its poster like every other
            background clip on the site.
          */}
          <div className="absolute inset-0 opacity-100">
            <BackgroundVideo
              src="/videos/hero-van.mp4"
              poster="/business-hero-poster.jpg"
              className="size-full"
              priority={false}
            />
          </div>
          <div className="absolute inset-0 bg-background/75" />
          <div className="absolute top-0 left-0 w-[60vw] h-[60vh] bg-[#EA580C]/[0.07] rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] bg-indigo-900/20 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
          {/* Trust Badge */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 text-amber-500 fill-amber-500" />
              ))}
            </div>
            <span className="text-foreground/90 text-xs font-medium tracking-wide drop-shadow-sm">
              <span className="text-foreground font-bold">5.0</span> average on Google
            </span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-[#EA580C]" />
            <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em] drop-shadow-sm">Our Story</span>
          </div>
          
          <div className="flex flex-wrap items-end gap-6 mb-2">
            <h1 className="font-heading text-5xl sm:text-7xl font-black tracking-tight text-foreground leading-[1.05] drop-shadow-md">
              Built on trust.<br />
              <span className="text-[#EA580C]">Driven by people.</span>
            </h1>
            
            {/* Live Availability Indicator */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm mb-2 sm:mb-3">
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">
                Vans Available Today
              </span>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-lg text-foreground/90 font-medium leading-relaxed drop-shadow-sm">
            A family-owned business from Condell Park, Sydney — helping tradespeople, couriers
            and businesses stay on the road since day one.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <a
              href="#our-story"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              Read our story <ArrowRight className="size-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground/90 hover:border-foreground hover:text-foreground transition-colors bg-background/50 backdrop-blur-sm"
            >
              Get in touch
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="bg-muted border-y border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06]">
            {STATS.map((s) => (
              <div key={s.label} className="px-6 py-8 text-center">
                <p className="font-heading text-3xl sm:text-4xl font-black text-foreground">{s.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── About Us paragraphs ── */}
      <section id="our-story" className="bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-16 items-start">
            {/* Left — label + heading */}
            <div className="lg:sticky lg:top-28">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-8 bg-[#EA580C]" />
                <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">Who We Are</span>
              </div>
              <h2 className="font-heading text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
                More than a rental.<br />A partnership.
              </h2>
              <p className="mt-6 text-muted-foreground text-base leading-relaxed">
                Every client who drives off our lot carries a piece of our reputation. That&apos;s why we
                care deeply about every vehicle, every hire, every kilometre.
              </p>
              <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted">
                <MapPin className="size-5 text-[#EA580C] shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Our yard</p>
                  <p className="text-foreground text-sm font-semibold mt-0.5">16 Ilma Street, Condell Park NSW</p>
                </div>
              </div>
              <div className="mt-8 relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl border border-border">
                <Image 
                  src="/images/xpdx-real-yard-pro.webp" 
                  alt="XPDX Rentals yard at 16 Ilma Street, Condell Park" 
                  fill 
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, 100vw"
                />
              </div>
            </div>

            {/* Right — paragraphs */}
            <div className="space-y-6">
              {ABOUT_US.map((p, i) => (
                <p
                  key={i}
                  className="text-muted-foreground text-[17px] leading-[1.8] border-l border-border pl-6"
                >
                  {p}
                </p>
              ))}
              <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl">
                <Image 
                  src="/images/xpdx-fleet-compound-branded.webp" 
                  alt="Our fleet of vans" 
                  fill 
                  className="object-cover" 
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values Grid ── */}
      <section className="bg-muted border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#EA580C]" />
            <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">Our Values</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-foreground mb-12">
            What we stand for
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-muted p-6 hover:border-[#EA580C]/30 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#EA580C]/0 to-[#EA580C]/0 group-hover:from-[#EA580C]/[0.05] transition-all duration-500" />
                <div className="relative">
                  <div className="inline-flex size-11 items-center justify-center rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/20 mb-4">
                    <Icon className="size-5 text-[#EA580C]" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Mission ── */}
      <section id="our-mission" className="relative bg-background py-24 sm:py-32 overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#EA580C]/[0.04] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-8 bg-[#EA580C]" />
                <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">Our Mission</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-10">
              Keep you moving.<br />Every single day.
            </h2>
            <div className="space-y-5">
              {OUR_MISSION.map((p, i) => (
                <p key={i} className="text-muted-foreground text-lg leading-[1.8]">{p}</p>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl hidden lg:block">
            <Image 
              src="/images/xpdx-team.webp" 
              alt="The XPDX Rentals team" 
              fill 
              className="object-cover" 
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
        </div>
      </section>

      {/* ── Competitive Advantages ── */}
      <section id="why-choose-us" className="bg-muted border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#EA580C]" />
            <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">Why XPDX</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-foreground mb-12">
            What&apos;s included in every hire
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ADVANTAGES.map((a) => {
              // `ICON_MAP` is already `Record<string, React.ElementType>`, so
              // the `as any` was casting a correctly-typed value to `any` and
              // discarding the index signature it already had.
              const Icon = ICON_MAP[a.icon] ?? Shield;
              return (
                <div
                  key={a.label}
                  className="group flex flex-col gap-3 rounded-2xl border border-border bg-muted p-5 hover:border-[#EA580C]/25 hover:bg-muted transition-all duration-300"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/15">
                    <Icon className="size-4 text-[#EA580C]" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{a.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA / Enquiry ── */}
      <section id="contact" className="relative bg-background border-t border-border py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#EA580C]/[0.06] rounded-full blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-[#EA580C]" />
            <span className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.25em]">Get Started</span>
            <div className="h-px w-8 bg-[#EA580C]" />
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl font-black text-foreground tracking-tight">
            Ready to get on the road?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            Tell us what you need. Our team responds fast — usually same business day.
          </p>
        </div>
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
          <div className="rounded-3xl border border-border bg-muted backdrop-blur-sm p-8 sm:p-10">
            <EnquiryForm phone={contact.phone} />
          </div>
        </div>
      </section>
    </>
  );
}
