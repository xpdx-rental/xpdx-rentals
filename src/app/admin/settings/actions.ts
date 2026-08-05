"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Settings — CLAUDE.md §7 screen 5.
 *
 * Everything the public site says about the business lives in the `settings`
 * key/value store so a non-technical operator can change it without a deploy.
 * Phone, email, address and hours render on every page, so they belong here
 * rather than in JSX.
 *
 * Phase 3 dropped `saveFinanceParams` (the calculator is gone) and rewrote
 * `saveLocationHours`, which wrote into the `locations` table that migration
 * 0019 drops — one operator, one yard, so hours are a setting now.
 */

const revalidate = revalidateTag as (tag: string) => void;

async function upsertSetting(key: string, value: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) return { error: error.message };
  revalidate("settings");
  revalidate("public");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function saveCompanyProfile(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const lat = String(formData.get("latitude") ?? "").trim();
  const lng = String(formData.get("longitude") ?? "").trim();
  return upsertSetting("company_profile", {
    legal_name: String(formData.get("legalName") ?? "").trim(),
    trading_name: String(formData.get("tradingName") ?? "").trim(),
    abn: String(formData.get("abn") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    // Geo drives the LocalBusiness JSON-LD, a real local-SEO signal. Blank
    // stays blank rather than defaulting to 0,0 — a Sydney van yard plotted in
    // the Gulf of Guinea is worse than no coordinates at all.
    latitude: lat === "" ? null : Number(lat),
    longitude: lng === "" ? null : Number(lng),
  });
}

export async function savePhoneNumbers(_prev: unknown, formData: FormData) {
  await requireAdmin();
  return upsertSetting("phone_numbers", {
    primary: String(formData.get("primary") ?? "").trim(),
    // wa.me wants digits only, no plus and no spaces.
    whatsapp: String(formData.get("whatsapp") ?? "").replace(/\D/g, ""),
  });
}

export async function saveNotificationRecipients(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const emails = String(formData.get("emails") ?? "")
    .split(/[\n,]/)
    .map((e) => e.trim())
    .filter(Boolean);
  return upsertSetting("notification_recipients", { emails });
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export async function saveOpeningHours(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const hours: Record<string, string> = {};
  for (const d of DAYS) {
    const v = String(formData.get(d) ?? "").trim();
    // Only store days the operator actually filled in. An empty day means
    // "not supplied", not "closed", and the two must not be conflated in
    // opening-hours markup.
    if (v) hours[d] = v;
  }
  return upsertSetting("opening_hours", hours);
}
