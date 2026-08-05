import { createPublicClient } from "@/lib/supabase/public";
import { requireEnv } from "@/lib/config";
import type { RoofHeight, VanStatus } from "@/lib/van";
import type { PublicVanRow, VanImageEmbedRow, VanSlugRow } from "@/lib/data/rows";

/**
 * Public fleet reads.
 *
 * Deliberately uses the ANON client, not the service-role one. RLS on `vans`
 * already restricts the public to `status <> 'draft'`, so letting Postgres
 * enforce it means a draft van cannot leak through a forgotten `.neq()` in
 * application code. The admin client bypasses RLS and has no business on the
 * public site (CLAUDE.md §1.10).
 *
 * It is also cookie-free, so these pages stay statically renderable — see
 * `lib/supabase/public.ts`.
 *
 * If these queries ever return a draft van, that is an RLS bug, and
 * `src/lib/supabase/rls.integration.test.ts` is the test that catches it.
 */

const BUCKET = "van-images";

export type PublicVanImage = { url: string; alt: string };

export type PublicVan = {
  id: string;
  slug: string;
  name: string;
  bodyType: string;
  wheelbaseLabel: string;
  roof: RoofHeight;
  tonnage: number;
  transmission: string;
  fuel: string;
  seats: number | null;
  priceWeeklyFrom: number;
  priceMonthlyFrom: number | null;
  minHireDays: number;
  lengthMm: number | null;
  heightMm: number | null;
  widthMm: number | null;
  wheelbaseMm: number | null;
  loadVolumeM3: number | null;
  payloadKg: number | null;
  features: string[];
  summary: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: VanStatus;
  sortOrder: number;
  updatedAt: string;
  images: PublicVanImage[];
  primaryImage: PublicVanImage | null;
};

function imageUrl(storagePath: string): string {
  const base = requireEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

const SELECT = `
  id, slug, name, body_type, wheelbase_label, roof, tonnage, transmission, fuel, seats,
  price_weekly_from, price_monthly_from, min_hire_days,
  length_mm, height_mm, width_mm, wheelbase_mm, load_volume_m3, payload_kg,
  features, summary, description, seo_title, seo_description, status, sort_order, updated_at,
  van_images ( storage_path, alt, is_primary, sort_order )
`;

function toPublicVan(r: PublicVanRow): PublicVan {
  const rows: VanImageEmbedRow[] = (r.van_images ?? [])
    .slice()
    .sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
  const images: PublicVanImage[] = rows.map((i) => ({
    url: imageUrl(i.storage_path),
    alt: i.alt,
  }));

  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    bodyType: r.body_type,
    wheelbaseLabel: r.wheelbase_label,
    roof: r.roof,
    tonnage: Number(r.tonnage),
    transmission: r.transmission,
    fuel: r.fuel,
    seats: r.seats ?? null,
    priceWeeklyFrom: Number(r.price_weekly_from),
    priceMonthlyFrom: r.price_monthly_from == null ? null : Number(r.price_monthly_from),
    minHireDays: Number(r.min_hire_days),
    lengthMm: r.length_mm ?? null,
    heightMm: r.height_mm ?? null,
    widthMm: r.width_mm ?? null,
    wheelbaseMm: r.wheelbase_mm ?? null,
    loadVolumeM3: r.load_volume_m3 == null ? null : Number(r.load_volume_m3),
    payloadKg: r.payload_kg ?? null,
    features: (r.features ?? []) as string[],
    summary: r.summary ?? null,
    description: r.description ?? null,
    seoTitle: r.seo_title ?? null,
    seoDescription: r.seo_description ?? null,
    status: r.status as VanStatus,
    sortOrder: Number(r.sort_order ?? 0),
    updatedAt: r.updated_at,
    images,
    primaryImage: images[0] ?? null,
  };
}

/**
 * The published fleet, in the operator's display order.
 *
 * Returns an empty array rather than throwing when the database is
 * unreachable: a fleet grid that fails to load must not take down the phone
 * number and enquiry form alongside it. Callers render an explicit empty
 * state.
 */
export async function getPublicVans(): Promise<PublicVan[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("vans")
      .select(SELECT)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return [];
    return ((data ?? []) as PublicVanRow[]).map(toPublicVan);
  } catch {
    return [];
  }
}

export async function getPublicVanBySlug(slug: string): Promise<PublicVan | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("vans").select(SELECT).eq("slug", slug).maybeSingle();
    if (error || !data) return null;
    return toPublicVan(data as PublicVanRow);
  } catch {
    return null;
  }
}

/** Slugs for `generateStaticParams` and the sitemap. Drafts excluded by RLS. */
export async function getPublicVanSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("vans").select("slug, updated_at");
    if (error) return [];
    return ((data ?? []) as VanSlugRow[]).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
  } catch {
    return [];
  }
}
