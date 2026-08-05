import { createAdminClient } from "@/lib/supabase/admin";
import { requireEnv } from "@/lib/config";
import type { Van, VanDetail, VanImage, VanListItem, VanStatus } from "@/lib/van";
import type {
  VanImageEmbedRow,
  VanImageRow,
  VanListRow,
  VanOptionRow,
  VanRow,
} from "@/lib/data/rows";

/**
 * Van reads.
 *
 * Staff-side functions use the admin (service-role) client and are only called
 * after a page-level `requireAdmin()` — the service-role client bypasses RLS,
 * so authorization must already have happened. The public read helper at the
 * bottom is the one that must stay RLS-safe.
 */

const BUCKET = "van-images";

const VAN_SELECT = `
  id, slug, name, body_type, wheelbase_label, roof, tonnage, transmission, fuel, seats,
  price_weekly_from, price_monthly_from, min_hire_days, price_verified,
  length_mm, height_mm, width_mm, wheelbase_mm, load_volume_m3, payload_kg, dimensions_verified,
  features, summary, description, seo_title, seo_description,
  status, sort_order, created_at, updated_at
`;

/** Public URL for a storage path in the van-images bucket. */
export function vanImageUrl(storagePath: string): string {
  const base = requireEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

function toVan(r: VanRow): Van {
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
    priceVerified: !!r.price_verified,

    lengthMm: r.length_mm ?? null,
    heightMm: r.height_mm ?? null,
    widthMm: r.width_mm ?? null,
    wheelbaseMm: r.wheelbase_mm ?? null,
    loadVolumeM3: r.load_volume_m3 == null ? null : Number(r.load_volume_m3),
    payloadKg: r.payload_kg ?? null,
    dimensionsVerified: !!r.dimensions_verified,

    features: (r.features ?? []) as string[],
    summary: r.summary ?? null,
    description: r.description ?? null,
    seoTitle: r.seo_title ?? null,
    seoDescription: r.seo_description ?? null,

    status: r.status as VanStatus,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toImage(r: VanImageRow): VanImage {
  return {
    id: r.id,
    vanId: r.van_id,
    storagePath: r.storage_path,
    alt: r.alt,
    sortOrder: Number(r.sort_order ?? 0),
    isPrimary: !!r.is_primary,
    url: vanImageUrl(r.storage_path),
  };
}

// ── Staff reads ─────────────────────────────────────────────────────────────

/**
 * Fleet list for the portal, in the operator's chosen display order.
 *
 * Includes drafts — this is the staff view. Carries the primary image and both
 * verification flags so the list can badge unconfirmed pricing and dimensions
 * at a glance (CLAUDE.md §7 screen 2).
 */
export async function getVanList(filters?: { status?: VanStatus }): Promise<VanListItem[]> {
  const supabase = createAdminClient();
  let q = supabase
    .from("vans")
    .select(
      `id, slug, name, status, sort_order, price_weekly_from,
       price_verified, dimensions_verified,
       van_images ( storage_path, alt, is_primary, sort_order )`,
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (filters?.status) q = q.eq("status", filters.status);

  const { data } = await q;

  return ((data ?? []) as VanListRow[]).map((r) => {
    const images: VanImageEmbedRow[] = r.van_images ?? [];
    // Prefer the flagged primary; fall back to the lowest sort_order so a van
    // whose primary has not been set still shows a thumbnail.
    const primary =
      images.find((i) => i.is_primary) ??
      images.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0] ??
      null;

    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      status: r.status as VanStatus,
      sortOrder: Number(r.sort_order ?? 0),
      priceWeeklyFrom: Number(r.price_weekly_from),
      priceVerified: !!r.price_verified,
      dimensionsVerified: !!r.dimensions_verified,
      primaryImage: primary
        ? { url: vanImageUrl(primary.storage_path), alt: primary.alt }
        : null,
      imageCount: images.length,
    };
  });
}

export async function getVanById(id: string): Promise<VanDetail | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("vans").select(VAN_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;

  const { data: imageRows } = await supabase
    .from("van_images")
    .select("id, van_id, storage_path, alt, sort_order, is_primary")
    .eq("van_id", id)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  return { ...toVan(data as VanRow), images: ((imageRows ?? []) as VanImageRow[]).map(toImage) };
}

/**
 * Is this slug free? Checked before save so a unique-violation never reaches
 * the operator as a raw Postgres error (CLAUDE.md §7 screen 3).
 */
export async function isVanSlugAvailable(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = createAdminClient();
  let q = supabase.from("vans").select("id").eq("slug", slug).limit(1);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q;
  return (data ?? []).length === 0;
}

/** Slim list for the leads inbox filter and the enquiry form. */
export async function getVanOptions(): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vans")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });
  return ((data ?? []) as VanOptionRow[]).map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
}
