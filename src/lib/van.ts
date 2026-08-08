/**
 * XPDX van-hire domain types and display vocabulary.
 *
 * These mirror the schema in supabase/migrations/0019_xpdx_core.sql. The
 * Supabase clients are still untyped (see docs/conversion/01-plan.md R5 — type
 * generation needs a live project), so the query functions in
 * `src/lib/data/vans.ts` shape raw rows into these explicitly. Field names are
 * camelCase at this boundary even though DB columns are snake_case.
 */

// ── Enums (mirror the PG types in 0019) ─────────────────────────────────────

/** Availability, never sale state. A van is never "sold". */
export type VanStatus = "draft" | "available" | "limited" | "unavailable";
export type RoofHeight = "standard" | "low" | "high";

export const VAN_STATUSES: VanStatus[] = ["draft", "available", "limited", "unavailable"];
export const ROOF_HEIGHTS: RoofHeight[] = ["standard", "low", "high"];

export const VAN_STATUS_LABELS: Record<VanStatus, string> = {
  draft: "Draft",
  available: "Available",
  limited: "Limited",
  unavailable: "Unavailable",
};

export const VAN_STATUS_STYLES: Record<VanStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  available: "bg-success/15 text-success",
  limited: "bg-warning/15 text-warning",
  unavailable: "bg-danger/15 text-danger",
};

export const ROOF_LABELS: Record<RoofHeight, string> = {
  standard: "Standard roof",
  low: "Low roof",
  high: "High roof",
};

// ── Entities ────────────────────────────────────────────────────────────────

export type VanImage = {
  id: string;
  vanId: string;
  storagePath: string;
  /** Never blank — enforced by a check constraint and by Zod. */
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
  /** Public URL derived from `storagePath`; not a column. */
  url: string;
};

export type Van = {
  id: string;
  slug: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  registration: string | null;
  bodyType: string;
  wheelbaseLabel: string;
  roof: RoofHeight;
  tonnage: number;
  transmission: string;
  fuel: string;
  seats: number | null;

  priceWeeklyFrom: number;
  priceMonthlyFrom: number | null;
  depositAmount: number | null;
  minHireDays: number;
  priceVerified: boolean;

  lengthMm: number | null;
  heightMm: number | null;
  widthMm: number | null;
  wheelbaseMm: number | null;
  loadVolumeM3: number | null;
  payloadKg: number | null;
  dimensionsVerified: boolean;

  features: string[];
  summary: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;

  status: VanStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type VanListItem = Pick<
  Van,
  | "id" | "slug" | "name" | "status" | "sortOrder"
  | "priceWeeklyFrom" | "priceVerified" | "dimensionsVerified"
> & {
  primaryImage: { url: string; alt: string } | null;
  imageCount: number;
};

export type VanDetail = Van & { images: VanImage[] };

// ── Formatting ──────────────────────────────────────────────────────────────

/** Weekly rate, whole dollars. "From $385/week". */
export function formatWeekly(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMm(n: number | null): string {
  return n == null ? "—" : `${new Intl.NumberFormat("en-AU").format(n)} mm`;
}

/** "2.5t" — tonnage is stored numeric(3,1). */
export function formatTonnage(n: number): string {
  return `${n}t`;
}

/**
 * Slugify a van name. Used to prefill the slug field; the operator can edit it
 * and uniqueness is checked server-side before save.
 */
export function slugifyVanName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
