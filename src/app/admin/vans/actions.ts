"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVanSlugAvailable } from "@/lib/data/vans";
import { VANS_CACHE_KEY } from "@/lib/data/public-vans";
import { invalidateCache } from "@/lib/redis";
import { isValidVanStorageKey, validateStoredImage } from "@/lib/security/image-validation";
import { vanSchema, vanImageSchema, parseFeaturesTextarea } from "@/lib/validation/van";
import sharp from "sharp";
import { slugifyVanName, type VanStatus } from "@/lib/van";

/**
 * Fleet mutations.
 *
 * Every action re-authorises with `requireAdmin()` before touching the
 * service-role client â€” a Server Action is a public HTTP endpoint, so the
 * page-level guard is not enough on its own.
 *
 * Errors come back as `{ error }` for the form to render. Nothing throws a raw
 * Postgres message at the operator: this portal is run by one non-technical
 * person and "duplicate key value violates unique constraint" is not a
 * message they can act on.
 */

type Result = { ok?: true; error?: string; fieldErrors?: Record<string, string> };

const BUCKET = "van-images";

/**
 * Pushes a fleet change out to the public site.
 *
 * Every mutation in this file used to revalidate only `/admin/*`. Nothing
 * cleared the Redis fleet cache (1 hour TTL) and nothing revalidated the public
 * ISR routes, so an operator who corrected a weekly rate saw it immediately in
 * the portal while customers were quoted the old price â€” on the homepage, the
 * fleet grid, the van's own page and the JSON-LD offer inside it â€” for up to an
 * hour afterwards. On a hire business, a stale published price is a consumer-law
 * problem, not a caching nicety.
 *
 * Redis first, then ISR: revalidating the pages before dropping the cache key
 * would let the re-render repopulate Redis with the value we are trying to
 * evict.
 *
 * Best-effort throughout â€” the write has already committed, and an operator
 * must never see a save fail because a cache did.
 */
async function publishFleetChange(slug?: string | null): Promise<void> {
  try {
    await invalidateCache(VANS_CACHE_KEY);
  } catch {
    // Stale-until-TTL is the old behaviour; never fail a save over it.
  }

  revalidatePath("/");
  revalidatePath("/vans");
  revalidatePath("/van-hire");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/vans/${slug}`);
}

/** Looks up a van's slug so the change can be pushed to its public page too. */
async function slugForVan(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<string | null> {
  const { data } = await supabase.from("vans").select("slug").eq("id", id).maybeSingle();
  return (data as { slug?: string } | null)?.slug ?? null;
}

function readVanForm(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    make: formData.get("make"),
    model: formData.get("model"),
    year: formData.get("year"),
    registration: formData.get("registration"),
    slug: formData.get("slug"),
    bodyType: formData.get("bodyType"),
    wheelbaseLabel: formData.get("wheelbaseLabel"),
    roof: formData.get("roof"),
    tonnage: formData.get("tonnage"),
    transmission: formData.get("transmission"),
    fuel: formData.get("fuel"),
    seats: formData.get("seats"),

    priceWeeklyFrom: formData.get("priceWeeklyFrom"),
    priceMonthlyFrom: formData.get("priceMonthlyFrom"),
    depositAmount: formData.get("depositAmount"),
    minHireDays: formData.get("minHireDays") ?? 28,
    priceVerified: formData.get("priceVerified") === "on",

    lengthMm: formData.get("lengthMm"),
    heightMm: formData.get("heightMm"),
    widthMm: formData.get("widthMm"),
    wheelbaseMm: formData.get("wheelbaseMm"),
    loadVolumeM3: formData.get("loadVolumeM3"),
    payloadKg: formData.get("payloadKg"),
    dimensionsVerified: formData.get("dimensionsVerified") === "on",

    features: parseFeaturesTextarea(formData.get("features") as string | null),
    summary: formData.get("summary"),
    description: formData.get("description"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),

    status: formData.get("status") ?? "draft",
    sortOrder: formData.get("sortOrder") ?? 0,
  };

  // An empty slug field means "derive it from the name" — the common case when
  // adding a van. The operator can still override it.
  if (!String(raw.slug ?? "").trim()) {
    raw.slug = slugifyVanName(String(raw.name ?? ""));
  }
  return raw;
}

function toRow(data: ReturnType<typeof vanSchema.parse>) {
  return {
    slug: data.slug,
    name: data.name,
    make: data.make,
    model: data.model,
    year: data.year,
    registration: data.registration,
    body_type: data.bodyType,
    wheelbase_label: data.wheelbaseLabel,
    roof: data.roof,
    tonnage: data.tonnage,
    transmission: data.transmission,
    fuel: data.fuel,
    seats: data.seats,
    price_weekly_from: data.priceWeeklyFrom,
    price_monthly_from: data.priceMonthlyFrom,
    deposit_amount: data.depositAmount,
    min_hire_days: data.minHireDays,
    price_verified: data.priceVerified,
    length_mm: data.lengthMm,
    height_mm: data.heightMm,
    width_mm: data.widthMm,
    wheelbase_mm: data.wheelbaseMm,
    load_volume_m3: data.loadVolumeM3,
    payload_kg: data.payloadKg,
    dimensions_verified: data.dimensionsVerified,
    features: data.features,
    summary: data.summary,
    description: data.description,
    seo_title: data.seoTitle,
    seo_description: data.seoDescription,
    status: data.status,
    sort_order: data.sortOrder,
  };
}

function fieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "_");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

export async function createVan(_prev: Result | null, formData: FormData): Promise<Result> {
  await requireAdmin();
  const parsed = vanSchema.safeParse(readVanForm(formData));
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  }

  // Checked before insert so a unique violation never surfaces as raw SQL.
  if (!(await isVanSlugAvailable(parsed.data.slug))) {
    return {
      error: "That URL slug is already in use.",
      fieldErrors: { slug: "Already used by another van" },
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("vans").insert(toRow(parsed.data)).select("id").single();
  if (error) return { error: error.message };

  // Handle optional image uploads during creation
  const imageFiles = formData.getAll("images") as File[];
  const primaryIndex = parseInt(formData.get("primaryImageIndex") as string || "0", 10);
  
  if (imageFiles.length > 0) {
    let sortOrder = 0;
    
    // Process sequentially to avoid memory spikes from sharp
    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      if (imageFile.size === 0 || imageFile.size > 20 * 1024 * 1024) continue;
      
      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const webpBuffer = await sharp(buffer)
          .resize({ width: 1920, height: 1080, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toBuffer();

        const rand = Math.random().toString(36).substring(2, 12);
        const epoch = Date.now();
        const key = `vans/${parsed.data.slug}/${rand}_${epoch}.webp`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(key, webpBuffer, { contentType: "image/webp" });

        if (!uploadError) {
          await supabase.from("van_images").insert({
            van_id: data.id,
            storage_path: key,
            alt: `${parsed.data.make} ${parsed.data.model} ${parsed.data.bodyType}`,
            sort_order: sortOrder,
            is_primary: i === primaryIndex,
          });
          sortOrder++;
        }
      } catch (err) {
        console.error(`Failed to process uploaded image ${i} during van creation`, err);
        // Non-fatal, keep trying other images
      }
    }
  }

  revalidatePath("/admin/vans");
  await publishFleetChange(parsed.data.slug);
  redirect(`/admin/vans/${data.id}?created=1`);
}

export async function updateVan(_prev: Result | null, formData: FormData): Promise<Result> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing van id." };

  const parsed = vanSchema.safeParse(readVanForm(formData));
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  }

  if (!(await isVanSlugAvailable(parsed.data.slug, id))) {
    return {
      error: "That URL slug is already in use.",
      fieldErrors: { slug: "Already used by another van" },
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("vans").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/vans");
  revalidatePath(`/admin/vans/${id}`);
  await publishFleetChange(parsed.data.slug);
  return { ok: true };
}

/** Inline status toggle from the fleet list. */
export async function setVanStatus(id: string, status: VanStatus): Promise<Result> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("vans").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/vans");
  // Availability is the single most time-sensitive field on the site â€” a van
  // marked unavailable must stop being offered now, not within the hour.
  await publishFleetChange(await slugForVan(supabase, id));
  return { ok: true };
}

/**
 * Move a van up or down the display order.
 *
 * Swaps `sort_order` with its neighbour rather than exposing the raw number:
 * a six-van fleet is reordered by nudging, and asking a non-technical operator
 * to hand-manage integers is how two vans end up sharing position 3.
 */
export async function moveVan(id: string, direction: "up" | "down"): Promise<Result> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("vans")
    .select("id, sort_order, name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const list = (rows ?? []) as { id: string; sort_order: number }[];
  const index = list.findIndex((v) => v.id === id);
  if (index === -1) return { error: "Van not found." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= list.length) return { ok: true }; // already at the end

  // Rewrite the whole order from the reordered array. Cheap at six vans, and
  // it repairs any duplicate or gapped sort_order values as a side effect.
  const reordered = [...list];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

  for (let i = 0; i < reordered.length; i++) {
    const { error } = await supabase.from("vans").update({ sort_order: i + 1 }).eq("id", reordered[i].id);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/vans");
  await publishFleetChange();
  return { ok: true };
}

export async function deleteVan(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = createAdminClient();

  // Remove the stored files too, or the bucket accumulates orphans that no
  // screen can reach. `van_images` rows cascade with the van.
  const { data: images } = await supabase
    .from("van_images")
    .select("storage_path")
    .eq("van_id", id);
  const paths = ((images ?? []) as { storage_path: string }[]).map((i) => i.storage_path);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);

  const { error } = await supabase.from("vans").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/vans");
  await publishFleetChange();
  redirect("/admin/vans");
}

// â”€â”€ Images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Registers an already-uploaded object against a van.
 *
 * ── Why the validation below is not optional ────────────────────────────────
 * This is a **direct-to-Storage** flow: the browser uploads to the `van-images`
 * bucket itself and then calls this action with the key it picked. So both the
 * key and the bytes arrive from the client, and a Server Action is a public
 * HTTP endpoint — `requireAdmin()` proves *who* is calling, not *what* they are
 * handing us.
 *
 * Previously `input.storagePath` went straight into `van_images.storage_path`
 * with no checks at all, and `lib/data/public-vans.ts` concatenates that value
 * into a public URL. A key containing `../` escapes the bucket, so
 * `../lead-attachments/<file>` would have published a private lead attachment
 * through the public van gallery.
 *
 * Three gates now, cheapest first:
 *   1. The key must match the exact format `vanStorageKey()` emits, and sit
 *      under *this* van's slug folder — checked against the slug in the
 *      database, not one supplied by the caller.
 *   2. The object must actually exist and decode as a real image, verified by
 *      reading its magic bytes with sharp rather than trusting the extension or
 *      the `Content-Type` the uploader declared.
 *   3. Its dimensions must be sane — the upper bound is what stops a
 *      decompression bomb, since `next/image` resizes every one of these on
 *      request.
 *
 * A file that fails is deleted rather than left orphaned in the bucket.
 */
export async function addVanImage(
  vanId: string,
  input: { storagePath: string; alt: string },
): Promise<Result> {
  await requireAdmin();
  const parsed = vanImageSchema.safeParse({ alt: input.alt, sortOrder: 0, isPrimary: false });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Alt text is required on every image." };
  }

  const supabase = createAdminClient();

  // The van's real slug, from the database — the caller does not get to assert
  // which folder its upload belongs in.
  const slug = await slugForVan(supabase, vanId);
  if (!slug) return { error: "That van no longer exists." };

  if (!isValidVanStorageKey(input.storagePath, slug)) {
    // Deliberately not echoed back: the caller learns the upload was refused,
    // not which part of the key was rejected.
    return { error: "That upload could not be accepted. Please try again." };
  }

  const validation = await validateStoredImage(supabase, BUCKET, input.storagePath);
  if (!validation.ok) {
    // Remove the rejected bytes. Leaving them costs storage and leaves a
    // publicly-readable object in a public bucket that no screen can reach.
    await supabase.storage
      .from(BUCKET)
      .remove([input.storagePath])
      .catch(() => {});
    return { error: validation.error };
  }

  const { count } = await supabase
    .from("van_images")
    .select("id", { count: "exact", head: true })
    .eq("van_id", vanId);

  const { error } = await supabase.from("van_images").insert({
    van_id: vanId,
    storage_path: input.storagePath,
    alt: parsed.data.alt,
    sort_order: count ?? 0,
    // First image uploaded becomes the primary, so a van is never left without
    // one just because nobody pressed the button.
    is_primary: (count ?? 0) === 0,
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/vans/${vanId}`);
  // `slug` is already in hand from the ownership check above — no second query.
  await publishFleetChange(slug);
  return { ok: true };
}

export async function updateVanImageAlt(imageId: string, vanId: string, alt: string): Promise<Result> {
  await requireAdmin();
  const parsed = vanImageSchema.shape.alt.safeParse(alt);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Alt text is required." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("van_images").update({ alt: parsed.data }).eq("id", imageId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/vans/${vanId}`);
  await publishFleetChange(await slugForVan(supabase, vanId));
  return { ok: true };
}

export async function setPrimaryVanImage(imageId: string, vanId: string): Promise<Result> {
  await requireAdmin();
  const supabase = createAdminClient();
  // Clear first: a partial unique index allows only one primary per van, so
  // setting the new one before clearing the old would violate it.
  const { error: clearErr } = await supabase
    .from("van_images")
    .update({ is_primary: false })
    .eq("van_id", vanId);
  if (clearErr) return { error: clearErr.message };

  const { error } = await supabase.from("van_images").update({ is_primary: true }).eq("id", imageId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/vans/${vanId}`);
  await publishFleetChange(await slugForVan(supabase, vanId));
  return { ok: true };
}

export async function moveVanImage(
  imageId: string,
  vanId: string,
  direction: "up" | "down",
): Promise<Result> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("van_images")
    .select("id, sort_order")
    .eq("van_id", vanId)
    .order("sort_order", { ascending: true });

  const list = (rows ?? []) as { id: string; sort_order: number }[];
  const index = list.findIndex((i) => i.id === imageId);
  if (index === -1) return { error: "Image not found." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= list.length) return { ok: true };

  const reordered = [...list];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
  for (let i = 0; i < reordered.length; i++) {
    const { error } = await supabase.from("van_images").update({ sort_order: i }).eq("id", reordered[i].id);
    if (error) return { error: error.message };
  }

  revalidatePath(`/admin/vans/${vanId}`);
  await publishFleetChange(await slugForVan(supabase, vanId));
  return { ok: true };
}

export async function deleteVanImage(imageId: string, vanId: string): Promise<Result> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("van_images")
    .select("storage_path, is_primary")
    .eq("id", imageId)
    .maybeSingle();

  const { error } = await supabase.from("van_images").delete().eq("id", imageId);
  if (error) return { error: error.message };

  if (row?.storage_path) await supabase.storage.from(BUCKET).remove([row.storage_path]);

  // If the primary was removed, promote the next image so the van keeps a
  // card thumbnail without the operator having to notice.
  if (row?.is_primary) {
    const { data: next } = await supabase
      .from("van_images")
      .select("id")
      .eq("van_id", vanId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next?.id) await supabase.from("van_images").update({ is_primary: true }).eq("id", next.id);
  }

  revalidatePath(`/admin/vans/${vanId}`);
  await publishFleetChange(await slugForVan(supabase, vanId));
  return { ok: true };
}
