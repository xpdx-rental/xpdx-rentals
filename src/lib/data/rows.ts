/**
 * Database row shapes, mirrored by hand from `supabase/migrations/0019_xpdx_core.sql`.
 *
 * Why these exist: the three Supabase client factories are untyped, because
 * `supabase gen types` needs a live project and there is not one yet
 * (docs/conversion/01-plan.md R5). Without a `Database` generic every
 * `.select()` returns `any`, and the mappers in this directory were reaching
 * into rows the compiler knew nothing about.
 *
 * What this is NOT: generated types. Nothing has checked these against a real
 * database. They are a reviewable statement of what the migration declares, so
 * a mapper that reads a column the schema does not have is a type error caught
 * in review rather than a runtime `undefined`. That is the class of bug that
 * put `vehicle_id` into a testimonials insert (docs/conversion/06-phase7-report.md §2).
 *
 * **When the Supabase project exists, replace this file with generated types**
 * — `npx supabase gen types typescript --linked > src/lib/database.types.ts` —
 * and pass `Database` to the client factories. Tracked in docs/handover.md.
 *
 * Two facts encoded here that are easy to get wrong:
 *
 * - PostgREST serialises Postgres `numeric` as a **string**, not a number, to
 *   avoid float precision loss. `tonnage` and `load_volume_m3` are typed
 *   `number | string` for that reason and every consumer runs them through
 *   `Number()`. `integer` columns do arrive as numbers.
 * - A to-one embed (`vans:van_id ( name )`) arrives as an object on some
 *   PostgREST versions and a one-element array on others, so the embed types
 *   admit both and the mappers normalise.
 */

/** `public.van_status` */
export type VanStatusRow = "draft" | "available" | "limited" | "unavailable";
/** `public.roof_height` */
export type RoofHeightRow = "standard" | "low" | "high";
/** `public.lead_status` */
export type LeadStatusRow = "new" | "contacted" | "quoted" | "won" | "lost" | "spam";
/** `public.device_type` — declared in 0001, preserved by 0019. */
export type DeviceTypeRow = "mobile" | "desktop" | "tablet" | "unknown";

/** `public.van_images`, full row. */
export type VanImageRow = {
  id: string;
  van_id: string;
  storage_path: string;
  alt: string;
  sort_order: number | null;
  is_primary: boolean | null;
};

/** `van_images ( storage_path, alt, is_primary, sort_order )` as embedded. */
export type VanImageEmbedRow = Pick<
  VanImageRow,
  "storage_path" | "alt" | "is_primary" | "sort_order"
>;

/** The columns `vans.ts` and `public-vans.ts` share. */
type VanCoreRow = {
  id: string;
  slug: string;
  name: string;
  body_type: string;
  wheelbase_label: string;
  roof: RoofHeightRow;
  tonnage: number | string;
  transmission: string;
  fuel: string;
  seats: number | null;
  price_weekly_from: number;
  price_monthly_from: number | null;
  min_hire_days: number;
  length_mm: number | null;
  height_mm: number | null;
  width_mm: number | null;
  wheelbase_mm: number | null;
  load_volume_m3: number | string | null;
  payload_kg: number | null;
  features: string[] | null;
  summary: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: VanStatusRow;
  sort_order: number | null;
  updated_at: string;
};

/** `public.vans` as selected by `VAN_SELECT` in `vans.ts`. */
export type VanRow = VanCoreRow & {
  price_verified: boolean | null;
  dimensions_verified: boolean | null;
  created_at: string;
};

/** `public.vans` as selected by `SELECT` in `public-vans.ts`. */
export type PublicVanRow = VanCoreRow & {
  van_images: VanImageEmbedRow[] | null;
};

/** The narrow projection behind the staff fleet list. */
export type VanListRow = Pick<
  VanRow,
  | "id"
  | "slug"
  | "name"
  | "status"
  | "sort_order"
  | "price_weekly_from"
  | "price_verified"
  | "dimensions_verified"
> & { van_images: VanImageEmbedRow[] | null };

export type VanOptionRow = Pick<VanRow, "id" | "name" | "slug">;
export type VanSlugRow = Pick<VanRow, "slug" | "updated_at">;

/** `public.leads` as selected by `LEAD_SELECT`, including the van-name embed. */
export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  suburb: string | null;
  van_id: string | null;
  van_slug_raw: string | null;
  duration: string | null;
  start_date: string | null;
  message: string | null;
  source: string | null;
  page_path: string | null;
  referrer: string | null;
  utm: Record<string, unknown> | null;
  device: DeviceTypeRow | null;
  status: LeadStatusRow;
  staff_notes: string | null;
  assigned_to: string | null;
  contacted_at: string | null;
  created_at: string;
  vans: { name: string } | { name: string }[] | null;
};

/**
 * `public.lead_events`.
 *
 * `event` is narrowed to the migration's CHECK constraint rather than left as
 * `text` — the column is only ever one of these five, and typing it loosely
 * would push the widening onto every consumer.
 */
export type LeadEventRow = {
  id: string;
  lead_id: string;
  actor_id: string | null;
  event: "created" | "status_changed" | "note" | "assigned" | "notified";
  data: Record<string, unknown> | null;
  created_at: string;
};

/**
 * `public.testimonials`, restricted to the columns that survive 0019 — it
 * drops `photo_media_id` and `vehicle_id`.
 */
export type TestimonialRow = {
  id: string;
  customer_name: string;
  rating: number;
  quote: string;
  source: string;
  review_date: string | null;
};
