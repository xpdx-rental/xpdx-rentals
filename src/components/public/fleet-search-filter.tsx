"use client";

import {
  useState,
  useMemo,
  useId,
  useTransition,
  useRef,
  useEffect,
} from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VanCard } from "@/components/public/van-card";
import type { PublicVan } from "@/lib/data/public-vans";
import { formatWeekly } from "@/lib/van";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "payload-desc"
  | "volume-desc";

interface Filters {
  q: string;
  bodyTypes: string[];
  roofHeights: string[];
  maxPrice: number | null;
  minPayload: number | null;
  minSeats: number | null;
}

const DEFAULT_FILTERS: Filters = {
  q: "",
  bodyTypes: [],
  roofHeights: [],
  maxPrice: null,
  minPayload: null,
  minSeats: null,
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "payload-desc", label: "Payload: Largest First" },
  { value: "volume-desc", label: "Volume: Largest First" },
];

const ROOF_LABELS: Record<string, string> = {
  low: "Low Roof",
  standard: "Standard Roof",
  high: "High Roof",
  "extra-high": "Extra High Roof",
};

const PRICE_PRESETS = [400, 500, 600, 700];
const PAYLOAD_PRESETS = [800, 1000, 1200, 1500];
const SEATS_PRESETS = [2, 3, 5, 12];

// ─── Pure filter + sort (no mutation) ────────────────────────────────────────

function applyFilters(
  vans: PublicVan[],
  f: Filters,
  sort: SortKey
): PublicVan[] {
  const q = f.q.trim().toLowerCase();

  const filtered = vans.filter((v) => {
    // Full-text search across all useful fields
    if (q) {
      const haystack = [
        v.name,
        v.bodyType,
        v.wheelbaseLabel,
        v.summary ?? "",
        v.description ?? "",
        ...v.features,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (f.bodyTypes.length && !f.bodyTypes.includes(v.bodyType)) return false;
    if (f.roofHeights.length && !f.roofHeights.includes(v.roof)) return false;
    if (f.maxPrice !== null && v.priceWeeklyFrom > f.maxPrice) return false;
    if (f.minPayload !== null && (v.payloadKg ?? 0) < f.minPayload) return false;
    if (f.minSeats !== null && (v.seats ?? 0) < f.minSeats) return false;

    return true;
  });

  // Use slice() to avoid mutating the original array
  const sorted = filtered.slice();
  switch (sort) {
    case "price-asc":
      sorted.sort((a, b) => a.priceWeeklyFrom - b.priceWeeklyFrom);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.priceWeeklyFrom - a.priceWeeklyFrom);
      break;
    case "payload-desc":
      sorted.sort((a, b) => (b.payloadKg ?? 0) - (a.payloadKg ?? 0));
      break;
    case "volume-desc":
      sorted.sort((a, b) => (b.loadVolumeM3 ?? 0) - (a.loadVolumeM3 ?? 0));
      break;
    default:
      sorted.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return sorted;
}

function countActiveFilters(f: Filters): number {
  return [
    !!f.q,
    f.bodyTypes.length > 0,
    f.roofHeights.length > 0,
    f.maxPrice !== null,
    f.minPayload !== null,
    f.minSeats !== null,
  ].filter(Boolean).length;
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
        active
          ? "bg-primary border-primary text-primary-foreground shadow-[0_0_14px_rgba(201,171,129,0.35)]"
          : "bg-black/20 border-white/5 text-white/60 hover:border-white/10 hover:text-white hover:bg-black/40 shadow-inner"
      }`}
    >
      {active && <Check className="size-3 shrink-0" aria-hidden="true" />}
      {label}
    </button>
  );
}

// ─── SortDropdown (with click-outside to close) ───────────────────────────────

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Sort";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-black/20 px-4 py-2.5 text-sm font-semibold text-white/80 shadow-inner transition-colors hover:border-white/10 hover:text-white"
      >
        {label}
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Sort order"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 min-w-[210px] rounded-2xl border border-white/10 bg-popover backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {SORT_OPTIONS.map((o) => (
              <li key={o.value} role="option" aria-selected={value === o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors hover:bg-white/[0.07] ${
                    value === o.value
                      ? "text-[#EA580C] font-semibold bg-[#EA580C]/[0.06]"
                      : "text-white/70"
                  }`}
                >
                  <span className="size-3.5 shrink-0 flex items-center justify-center">
                    {value === o.value && (
                      <Check className="size-3.5 text-[#EA580C]" />
                    )}
                  </span>
                  {o.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ActivePill ───────────────────────────────────────────────────────────────

function ActivePill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#EA580C]/10 border border-[#EA580C]/25 pl-3 pr-2 py-1 text-[11px] text-[#EA580C] font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="ml-0.5 rounded-full p-0.5 hover:bg-[#EA580C]/20 transition-colors"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

// ─── Main FleetSearchFilter ───────────────────────────────────────────────────

export function FleetSearchFilter({ vans }: { vans: PublicVan[] }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [, startTransition] = useTransition();
  const searchId = useId();

  // Derived option lists computed once from the dataset
  const bodyTypes = useMemo(
    () => Array.from(new Set(vans.map((v) => v.bodyType))).sort(),
    [vans]
  );
  const roofHeights = useMemo(() => {
    const order = ["low", "standard", "high", "extra-high"];
    return Array.from(new Set(vans.map((v) => v.roof))).sort(
      (a, b) => order.indexOf(a) - order.indexOf(b)
    );
  }, [vans]);

  const filtered = useMemo(
    () => applyFilters(vans, filters, sort),
    [vans, filters, sort]
  );
  const activeCount = countActiveFilters(filters);

  // Helpers
  const patch = (p: Partial<Filters>) =>
    startTransition(() => setFilters((f) => ({ ...f, ...p })));

  const toggle = (key: "bodyTypes" | "roofHeights", value: string) =>
    patch({
      [key]: filters[key].includes(value)
        ? filters[key].filter((x) => x !== value)
        : [...filters[key], value],
    });

  const clearAll = () =>
    startTransition(() => {
      setFilters(DEFAULT_FILTERS);
      setSort("recommended");
    });

  return (
    <div>
      {/* ── Sticky search bar ── */}
      <div className="sticky top-20 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row gap-3">
          {/* Text search */}
          <label htmlFor={searchId} className="sr-only">
            Search vehicles
          </label>
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/30 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={filters.q}
              onChange={(e) => patch({ q: e.target.value })}
              placeholder="Search by model, body type, feature…"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-white/5 bg-black/20 shadow-inner pl-11 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => patch({ q: "" })}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-white/30 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-controls="filter-panel"
              className={`relative inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all backdrop-blur-sm ${
                  filtersOpen || activeCount > 0
                    ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_rgba(201,171,129,0.2)]"
                    : "border-white/5 bg-black/20 shadow-inner text-white/70 hover:border-white/10 hover:text-white hover:bg-black/40"
              }`}
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {activeCount > 0 && (
                <span
                  aria-live="polite"
                  className="flex size-5 items-center justify-center rounded-full bg-[#EA580C] text-[10px] font-bold text-white"
                >
                  {activeCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <SortDropdown value={sort} onChange={setSort} />

            {/* Clear all */}
            <AnimatePresence>
              {(activeCount > 0 || sort !== "recommended") && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={clearAll}
                  aria-label="Clear all filters"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/50 hover:text-white hover:border-white/25 transition-colors"
                >
                  <X className="size-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Expandable filter panel ── */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            id="filter-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-b border-white/[0.06] bg-muted px-4 sm:px-6 py-8">
              <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">

                {/* Body Type */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">
                    Body Type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bodyTypes.map((bt) => (
                      <FilterChip
                        key={bt}
                        label={bt}
                        active={filters.bodyTypes.includes(bt)}
                        onClick={() => toggle("bodyTypes", bt)}
                      />
                    ))}
                  </div>
                </div>

                {/* Roof Height */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">
                    Roof Height
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roofHeights.map((rh) => (
                      <FilterChip
                        key={rh}
                        label={ROOF_LABELS[rh] ?? rh}
                        active={filters.roofHeights.includes(rh)}
                        onClick={() => toggle("roofHeights", rh)}
                      />
                    ))}
                  </div>
                </div>

                {/* Max Weekly Price */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">
                    Max Weekly Rate
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_PRESETS.map((p) => (
                      <FilterChip
                        key={p}
                        label={`≤ ${formatWeekly(p)}`}
                        active={filters.maxPrice === p}
                        onClick={() =>
                          patch({ maxPrice: filters.maxPrice === p ? null : p })
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Min Payload */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">
                    Min Payload
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PAYLOAD_PRESETS.map((p) => (
                      <FilterChip
                        key={p}
                        label={`≥ ${p} kg`}
                        active={filters.minPayload === p}
                        onClick={() =>
                          patch({
                            minPayload: filters.minPayload === p ? null : p,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Min Seats */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">
                    Min Seats
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SEATS_PRESETS.map((s) => (
                      <FilterChip
                        key={s}
                        label={`${s}+`}
                        active={filters.minSeats === s}
                        onClick={() =>
                          patch({
                            minSeats: filters.minSeats === s ? null : s,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results bar ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.04]">
        <p className="text-sm text-white/40 font-mono shrink-0" aria-live="polite">
          <span className="text-white font-bold text-base">{filtered.length}</span>
          {" of "}
          <span className="text-white/60">{vans.length}</span>
          {" vehicles"}
        </p>

        {/* Active filter pills — one per active condition */}
        <div className="flex flex-wrap gap-2">
          {filters.q && (
            <ActivePill
              label={`"${filters.q}"`}
              onRemove={() => patch({ q: "" })}
            />
          )}
          {filters.bodyTypes.map((bt) => (
            <ActivePill
              key={bt}
              label={bt}
              onRemove={() => toggle("bodyTypes", bt)}
            />
          ))}
          {filters.roofHeights.map((rh) => (
            <ActivePill
              key={rh}
              label={ROOF_LABELS[rh] ?? rh}
              onRemove={() => toggle("roofHeights", rh)}
            />
          ))}
          {filters.maxPrice !== null && (
            <ActivePill
              label={`≤ ${formatWeekly(filters.maxPrice)}/wk`}
              onRemove={() => patch({ maxPrice: null })}
            />
          )}
          {filters.minPayload !== null && (
            <ActivePill
              label={`≥ ${filters.minPayload} kg`}
              onRemove={() => patch({ minPayload: null })}
            />
          )}
          {filters.minSeats !== null && (
            <ActivePill
              label={`${filters.minSeats}+ seats`}
              onRemove={() => patch({ minSeats: null })}
            />
          )}
        </div>
      </div>

      {/* ── Vehicle grid / empty state ── */}
      {filtered.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-6xl px-4 sm:px-6 py-16"
        >
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <Search className="size-10 text-white/20 mb-4" aria-hidden="true" />
            <p className="font-heading text-xl font-bold text-white/80">
              No vehicles match your criteria
            </p>
            <p className="mt-2 text-sm text-white/40 max-w-xs leading-relaxed">
              Try broadening your search, removing some filters, or{" "}
              <button
                type="button"
                onClick={clearAll}
                className="text-[#EA580C] underline underline-offset-2 hover:no-underline"
              >
                clearing all
              </button>
              {" "}to see the full fleet.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#EA580C]/10 border border-[#EA580C]/30 px-6 py-3 text-sm font-semibold text-[#EA580C] hover:bg-[#EA580C]/20 transition-colors"
            >
              <X className="size-4" />
              Clear all filters
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 pb-16">
          <motion.div
            layout
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((v, i) => (
                <motion.div
                  key={v.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{
                    duration: 0.22,
                    delay: Math.min(i * 0.035, 0.25),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <VanCard van={v} priority={i < 3} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}
