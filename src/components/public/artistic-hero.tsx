"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionTemplate,
} from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  Shield,
  Search,
  Truck,
  Users,
  Mail,
  PackageSearch,
  ChevronDown,
  Key,
  TrendingUp,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type { PublicVan } from "@/lib/data/public-vans";
import { formatWeekly } from "@/lib/van";
import { telHref, waHref } from "@/lib/lead";
import { useRef, useState } from "react";
import { BackgroundVideo } from "@/components/public/background-video";
import { MagneticButton } from "@/components/ui/magnetic-button";
import type { SiteContact } from "@/lib/data/settings";

function SteeringWheel(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 12 12 2" />
      <path d="M12 12 20.66 17" />
      <path d="M12 12 3.34 17" />
    </svg>
  );
}

// ─── Spotlight gradient that follows cursor ─────────────────────────────────
function CursorSpotlight() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(600px circle at ${x}px ${y}px, rgba(255,95,0,0.06) 0%, transparent 60%)`;

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      onMouseMove={handleMouse}
      style={{ background }}
      className="absolute inset-0 z-10 pointer-events-none"
    />
  );
}

// ─── Quick Search Form ──────────────────────────────────────────────────────
// Shared between the desktop floating pill and the mobile inline card so the
// two layouts can never drift out of sync with each other.
function QuickSearchForm({
  query,
  onQueryChange,
  onSubmit,
  pill = true,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  pill?: boolean;
}) {
  return (
    <form
      onSubmit={onSubmit}
      aria-label="Find a van"
      className={
        pill
          ? "flex flex-col md:flex-row items-center gap-2 p-2 rounded-full bg-background/90 border border-border backdrop-blur-2xl shadow-xl"
          : "flex items-center gap-2 p-2 rounded-2xl bg-background/90 border border-border backdrop-blur-md"
      }
    >
      <div className="flex-1 flex items-center gap-3 px-4 py-2 min-w-0">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="flex flex-col w-full min-w-0">
          <label
            htmlFor={pill ? "search-desktop" : "search-mobile"}
            className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold mb-0.5 cursor-pointer"
          >
            Find a van
          </label>
          <div className="relative flex items-center w-full">
            <input
              id={pill ? "search-desktop" : "search-mobile"}
              name="q"
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search by model, feature..."
              className="bg-transparent border-none p-0 pr-6 text-sm text-foreground placeholder:text-muted-foreground font-medium focus:ring-0 appearance-none w-full outline-none truncate"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="pl-2">
        <button
          type="submit"
          className="flex items-center justify-center size-14 shrink-0 rounded-full bg-primary hover:bg-primary-hover transition-colors text-primary-foreground shadow-lg"
          aria-label="Search"
        >
          <Search className="size-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

// ─── Stat Chip ───────────────────────────────────────────────────────────────
function StatChip({
  icon,
  label,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm"
    >
      <span className="text-primary">{icon}</span>
      <span className="text-white/70 text-xs font-medium tracking-wide">{label}</span>
    </motion.div>
  );
}

// ─── Main Hero ───────────────────────────────────────────────────────────────
export function ArtisticHero({
  contact,
  cheapest,
  vans,
}: {
  contact: SiteContact;
  cheapest: number | null;
  vans: PublicVan[];
}) {
  const containerRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/vans?q=${encodeURIComponent(query)}` : "/vans");
  };

  // The reduced-motion / Save-Data / slow-connection gating for the background
  // clip now lives inside <BackgroundVideo>, alongside the deferred fetch —
  // pausing after autoplay had already started still paid for the download.

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity  = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full bg-background z-20"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/*
          ── Full Bleed Background Video ─────────────────────────────────────
          Self-hosted at /public/videos/hero-van.mp4 (same-origin, so no CSP
          media-src change needed) — an AI-generated ad clip of an XPDX-liveried
          Sprinter in motion, re-encoded with ffmpeg's delogo filter to remove
          the generator's watermark. Poster is the real fleet photo, so there
          is no blank/black frame before the video can play.
        */}
        <motion.div style={{ y: imageY }} className="absolute inset-0 h-[calc(100%+120px)] w-full opacity-60">
          <BackgroundVideo
            src="/videos/business-van-rental-hero.mp4"
            poster="/vans/sprinter-l2h2.jpg"
            className="size-full"
            objectPosition="object-top"
            priority
          />
        </motion.div>

        {/*
          ── Left side gradient overlay ─────────────────────────────────────
          Narrowed from 75% to 55%: the copy block (max-w-2xl) only reaches
          ~53% of viewport width at common desktop sizes, and the van in the
          footage occupies most of the frame — at 75% the gradient buried the
          whole front half of the van under 90%+ black. 55% still fully covers
          the text with a fade margin and leaves the van legible.
        */}
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-black via-black/90 to-transparent lg:w-[55%]" />
        
        {/* ── Bottom edge blend ─────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        {/* ── Cursor spotlight ──────────────────────────────────────────────── */}
        <CursorSpotlight />

        {/* ── Subtle grid (restricted to the gradient area) ─────────────────── */}
        <div
          className="absolute inset-0 z-0 lg:w-[50%]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* ── Single precision accent line ──────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent z-20" />
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="relative z-20 mx-auto w-full max-w-[1400px] px-6 lg:px-12 pt-16 pb-24">
        <motion.div style={{ y: contentY, opacity }} className="flex flex-col justify-center max-w-2xl">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-10 bg-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-[0.25em]">
              Long-Term Van Hire · Sydney
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </motion.div>

          {/* Main Heading — editorial, razor-sharp */}
          <h1 className="font-heading font-black leading-[0.92] tracking-[-0.03em]">
            {["100+ Vans.", "Ready To", "Work."].map((word, i) => (
              <motion.span
                key={word}
                className="block overflow-hidden"
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 1,
                  delay: 0.15 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <span
                  className={
                    i === 1
                      ? "text-primary text-[clamp(2.5rem,6vw,5rem)]"
                      : "text-white text-[clamp(2.5rem,6vw,5rem)]"
                  }
                >
                  {word}
                </span>
              </motion.span>
            ))}
          </h1>

          {/* Body copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 text-white/90 font-medium text-lg leading-relaxed max-w-md drop-shadow-sm"
          >
            Powering Sydney&apos;s trades, couriers, and businesses. Tap into our massive fleet of 100+ commercial vans with unlimited kilometres and comprehensive insurance included.
          </motion.p>



          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-4 mt-8"
          >
            <MagneticButton
              href="/vans"
              className="group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full bg-primary pl-8 pr-6 font-bold text-primary-foreground text-[15px] tracking-tight shadow-[0_8px_32px_rgba(255,95,0,0.35)] transition-shadow hover:shadow-[0_12px_48px_rgba(255,95,0,0.5)]"
            >
              {/* shimmer sweep */}
              <span className="absolute inset-0 [transform:skew(-20deg)_translateX(-120%)] group-hover:[transform:skew(-20deg)_translateX(200%)] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative">Explore Fleet</span>
              <span className="relative ml-1 flex size-8 items-center justify-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1">
                <ArrowRight className="size-4" />
              </span>
            </MagneticButton>



            {contact?.phone && (
              <MagneticButton
                href={telHref(contact.phone)}
                className="group inline-flex h-14 items-center gap-3 rounded-full border border-white/10 bg-transparent px-7 font-bold text-white/70 text-[15px] tracking-tight transition-all hover:text-white"
              >
                <Phone className="size-4 text-primary transition-transform group-hover:rotate-12" />
                {contact.phone}
              </MagneticButton>
            )}

            {contact?.whatsapp && (
              <MagneticButton
                href={waHref(contact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message us on WhatsApp"
                className="group inline-flex size-14 items-center justify-center rounded-full border border-white/10 bg-transparent text-white/70 transition-all hover:border-emerald-400/40 hover:text-emerald-400"
              >
                <WhatsAppIcon className="size-5 transition-transform group-hover:scale-110" />
              </MagneticButton>
            )}
          </motion.div>

          {/* Starting price & Availability */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-8 pt-6 border-t border-white/[0.06] flex flex-wrap items-center gap-6"
          >
            {cheapest && Number.isFinite(cheapest) && (
              <div className="flex items-center gap-4">
                <div className="h-px w-6 bg-primary/60" />
                <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-medium">
                  From{" "}
                  <span className="text-white font-bold text-base tracking-tight">
                    {formatWeekly(cheapest)}
                  </span>{" "}
                  / week
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">
                Vans Available Today
              </span>
            </div>
          </motion.div>

          {/* Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-12 w-full"
          >
            <div className="flex flex-col items-start w-full">
              <div className="relative inline-flex items-center justify-start py-2">
                {/* Left bracket */}
                <div className="absolute left-0 top-0 w-6 h-full border-y-2 border-l-2 border-primary/80" />
                
                <h2 className="text-3xl sm:text-5xl font-black text-primary tracking-tight px-8 sm:px-10 z-10 py-2 uppercase">
                  Rent. Drive. Thrive.
                </h2>

                {/* Right bracket */}
                <div className="absolute right-0 top-0 w-6 h-full border-y-2 border-r-2 border-primary/80" />
              </div>

              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 w-full pl-2">
                <div className="flex items-center gap-2">
                  <Key className="size-5 sm:size-6 text-primary" strokeWidth={2} />
                  <span className="text-sm sm:text-base font-medium text-white">Get the van.</span>
                </div>
                <div className="flex items-center gap-2">
                  <SteeringWheel className="size-5 sm:size-6 text-primary" strokeWidth={2} />
                  <span className="text-sm sm:text-base font-medium text-white">Get to work.</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 sm:size-6 text-primary" strokeWidth={2} />
                  <span className="text-sm sm:text-base font-medium text-white">Grow your business.</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick search — inline, mobile only. The desktop version is the
              floating pill below; mobile gets it in normal flow instead of
              zero search capability at all below md. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 md:hidden"
          >
            <QuickSearchForm
              query={query}
              onQueryChange={setQuery}
              onSubmit={handleSearch}
              pill={false}
            />
          </motion.div>
        </motion.div>



          {/* Scroll cue (Mobile only now) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-6 left-0 right-0 mx-auto flex flex-col items-center gap-2 md:hidden"
          >
            <p className="text-white/25 text-[10px] uppercase tracking-[0.3em]">Scroll</p>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-10 bg-gradient-to-b from-primary/60 to-transparent"
            />
          </motion.div>
      </div>


      {/* Quick Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: "150%" }}
        animate={{ opacity: 1, y: "50%" }}
        transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-4xl px-4 z-50 hidden md:block"
      >
        <QuickSearchForm
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSearch}
          pill
        />
      </motion.div>
    </section>
  );
}
