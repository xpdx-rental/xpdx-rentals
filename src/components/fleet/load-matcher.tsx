"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LOAD_PRESETS,
  matchFleet,
  type LoadPreset,
  type Verdict,
} from "@/lib/load-matcher";
import { type VanDimensions } from "@/lib/fleet-geometry";
import { formatWeekly } from "@/lib/van";
import { ArrowRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

/**
 * Load Matcher — completely rebuilt with real van images, fill-bar
 * visualisation and a cinematic dark-mode card layout.
 *
 * ⚠ `data-provisional`: verdicts are ordinal-size-based until real
 * `load_volume_m3` data arrives from the client.
 */

export type LoadMatcherVan = VanDimensions & {
  priceWeeklyFrom: number;
  primaryImageUrl?: string | null;
  primaryImageAlt?: string | null;
};

// ─── Cargo category emoji / icon ─────────────────────────────────────────────
const LOAD_ICONS: Record<string, string> = {
  courier:  "📦",
  trade:    "🔧",
  event:    "🎭",
  pallet:   "🏗️",
  bulky:    "🏭",
};

// ─── Verdict styles ───────────────────────────────────────────────────────────
const VERDICT_CONFIG: Record<
  Verdict,
  { label: string; color: string; bg: string; border: string; Icon: typeof CheckCircle2 }
> = {
  recommended: {
    label: "Recommended",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/25",
    Icon: CheckCircle2,
  },
  tight: {
    label: "Will do the job",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/25",
    Icon: AlertCircle,
  },
  "too-small": {
    label: "Too small",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/25",
    Icon: XCircle,
  },
};

// ─── Fill bar ─────────────────────────────────────────────────────────────────
function FillBar({ fillRatio, verdict }: { fillRatio: number; verdict: Verdict }) {
  const pct = Math.min(fillRatio * 100, 100);
  const overflowing = fillRatio > 1;

  const barColor =
    verdict === "recommended"
      ? "bg-emerald-400"
      : verdict === "tight"
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-white/30">
          Cargo fill
        </span>
        <span className={`text-[10px] font-mono font-bold ${VERDICT_CONFIG[verdict].color}`}>
          {overflowing ? "OVERFLOW" : `${Math.round(pct)}%`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Van card ─────────────────────────────────────────────────────────────────
// Maps slugs → local image paths for vans that have photos
const LOCAL_IMAGES: Record<string, { src: string; alt: string }> = {
  "mercedes-sprinter-313-l2h2": {
    src: "/vans/sprinter-l2h2.jpg",
    alt: "Mercedes-Benz Sprinter 313 CDI L2H2 — side profile, white cargo van",
  },
  "toyota-hiace-super-lwb": {
    src: "/vans/hiace-lwb.jpg",
    alt: "Toyota HiAce Super LWB Panel Van — side profile, white cargo van",
  },
  "mercedes-sprinter-519-l3h3": {
    src: "/vans/sprinter-l3h3.jpg",
    alt: "Mercedes-Benz Sprinter 519 CDI L3H3 Jumbo — side profile, white cargo van",
  },
  "ford-transit-custom-340l": {
    src: "/vans/transit-custom.jpg",
    alt: "Ford Transit Custom 340L SWB — side profile, white cargo van",
  },
};

function VanCard({
  van,
  fillRatio,
  verdict,
  index,
}: {
  van: LoadMatcherVan;
  fillRatio: number;
  verdict: Verdict;
  index: number;
}) {
  const cfg = VERDICT_CONFIG[verdict];
  const localImg = LOCAL_IMAGES[van.slug];
  const imgSrc = localImg?.src ?? van.primaryImageUrl ?? null;
  const imgAlt = localImg?.alt ?? van.primaryImageAlt ?? `${van.name} cargo van`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${
        verdict === "recommended"
          ? "border-emerald-400/10 hover:border-emerald-400/30 bg-emerald-400/[0.02]"
          : verdict === "tight"
          ? "border-amber-400/10 hover:border-amber-400/20 bg-white/[0.01]"
          : "border-border hover:border-primary/30 bg-card opacity-60 hover:opacity-100"
      }`}
    >
      {/* Van image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={imgAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition-all duration-500 group-hover:scale-105 ${
              verdict === "too-small" ? "grayscale opacity-40" : "opacity-80 group-hover:opacity-100"
            }`}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="text-4xl opacity-20">🚐</span>
          </div>
        )}

        {/* Verdict badge overlay */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur-sm ${cfg.color} ${cfg.bg} ${cfg.border}`}
          >
            <cfg.Icon className="size-3" />
            {cfg.label}
          </span>
        </div>

        {/* Price chip */}
        <div className="absolute bottom-3 right-3">
          <span className="rounded-full bg-background/80 border border-border px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur-sm">
            From {formatWeekly(van.priceWeeklyFrom)}/wk
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-heading text-sm font-bold text-foreground leading-snug line-clamp-2">
          {van.name}
        </h3>

        <FillBar fillRatio={fillRatio} verdict={verdict} />

        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <Link
            href={`/vans/${van.slug}`}
            className={`inline-flex items-center gap-1 text-xs font-bold transition-colors ${cfg.color} hover:underline`}
          >
            View van <ArrowRight className="size-3" />
          </Link>
          {verdict !== "too-small" && (
            <Link
              href={`/contact-us`}
              className="inline-flex items-center gap-1 rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/20 px-2.5 py-1.5 text-[10px] font-bold text-[#EA580C] hover:bg-[#EA580C]/20 transition-colors"
            >
              Book this
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LoadMatcher({ vans }: { vans: LoadMatcherVan[] }) {
  const [load, setLoad] = useState<LoadPreset>(LOAD_PRESETS[1]);

  const matches = useMemo(() => matchFleet(vans, load), [vans, load]);

  // Sort: recommended first, tight second, too-small last
  const verdictOrder: Verdict[] = ["recommended", "tight", "too-small"];
  const sortedMatches = [...matches].sort(
    (a, b) => verdictOrder.indexOf(a.verdict) - verdictOrder.indexOf(b.verdict)
  );

  const recommendedCount = matches.filter((m) => m.verdict === "recommended").length;
  const tightCount = matches.filter((m) => m.verdict === "tight").length;

  if (matches.length === 0) return null;

  return (
    <div data-provisional="true" className="space-y-8">

      {/* ── Cargo selector ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          What are you moving?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" role="radiogroup" aria-label="Select cargo type">
          {LOAD_PRESETS.map((p) => {
            const isActive = p.id === load.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setLoad(p)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-all duration-300 ${
                  isActive
                    ? "border-primary/50 bg-primary/10 shadow-[0_0_30px_rgba(255,95,0,0.15)]"
                    : "border-border bg-card hover:border-primary/30 hover:bg-accent/50 shadow-sm"
                }`}
              >
                <span className="text-2xl" role="img" aria-label={p.label}>
                  {LOAD_ICONS[p.id]}
                </span>
                <span className={`text-xs font-bold leading-tight ${isActive ? "text-primary" : "text-foreground/70"}`}>
                  {p.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {p.hint}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="load-selector-indicator"
                    className="absolute inset-0 rounded-2xl ring-1 ring-primary/40"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Results summary ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={load.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex flex-wrap items-center gap-4 py-4 border-t border-b border-border"
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="text-2xl">{LOAD_ICONS[load.id]}</span>
            <span className="font-bold text-foreground">{load.label}</span>
            <span className="text-muted-foreground">→</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-semibold">
              <CheckCircle2 className="size-4" />
              {recommendedCount} vans recommended
            </span>
            {tightCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-400 font-semibold">
                <AlertCircle className="size-4" />
                {tightCount} will do the job
              </span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Van grid ── */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        <AnimatePresence>
          {sortedMatches.map((match, i) => {
            const van = vans.find((v) => v.slug === match.slug);
            if (!van) return null;
            return (
              <VanCard
                key={van.slug}
                van={van}
                fillRatio={match.fillRatio}
                verdict={match.verdict}
                index={i}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-muted-foreground border-t border-border pt-4 leading-relaxed">
        ⚠️ This is a guide based on van size, not a measured capacity. Tell us what you are
        carrying and we will confirm the right van before you book.{" "}
        <Link href="/contact-us" className="text-[#EA580C] hover:underline font-semibold">
          Talk to our team →
        </Link>
      </p>
    </div>
  );
}
