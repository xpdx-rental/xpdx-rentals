import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADDRESS, GEO, CONTACT } from "@/lib/business";

/**
 * Site settings — the operator-editable values that render on every public
 * page (CLAUDE.md §7 screen 5).
 *
 * Every read falls back to the CLAUDE.md §3 values rather than to invented
 * ones, and to `null` where §3 has nothing. A missing phone number renders as
 * nothing; it never renders as a wrong number. Phase 1 removed a hardcoded
 * fallback here that published another client's real email address.
 */

export type SiteContact = {
  tradingName: string;
  legalName: string | null;
  abn: string | null;
  email: string | null;
  phone: string | null;
  /** Digits only, country code first, for wa.me. */
  whatsapp: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type OpeningHours = Record<string, string>;

/**
 * One read of the whole `settings` table, shared for the life of a request.
 *
 * `getSiteContact()` and `getOpeningHours()` both need it, and both are called
 * on almost every public page — the header, the footer and the LocalBusiness
 * JSON-LD all want the contact block. Each was independently wrapped in
 * `unstable_cache`, so a cold cache meant **two identical `SELECT key, value
 * FROM settings`** per render, and the homepage issued both.
 *
 * `cache()` (React's per-request memo) collapses them into one. It composes
 * with the `unstable_cache` wrappers below rather than replacing them: those
 * still hold the value across requests, this deduplicates within one.
 */
const readSettings = cache(async function readSettings(): Promise<
  Record<string, Record<string, unknown>>
> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("settings").select("key, value");
    if (error) return {};
    return Object.fromEntries(
      ((data ?? []) as { key: string; value: Record<string, unknown> }[]).map((r) => [
        r.key,
        r.value ?? {},
      ]),
    );
  } catch {
    // The site must still render its copy, phone-less, if settings are
    // unreachable. Failing the whole page would lose every lead on it.
    return {};
  }
});

function str(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

export const getSiteContact = unstable_cache(
  async (): Promise<SiteContact> => {
    const s = await readSettings();
    const company = s.company_profile ?? {};
    const phones = s.phone_numbers ?? {};
    return {
      tradingName: str(company.trading_name) ?? "XPDX Rentals",
      legalName: str(company.legal_name),
      abn: str(company.abn),
      email: str(company.email),
      // §3 values as the fallback: the phone number is the highest-value
      // control on the site and must never be missing because settings is
      // unreachable. Both are authorised business facts, not guesses.
      phone: str(phones.primary) ?? CONTACT.phoneDisplay,
      whatsapp: str(phones.whatsapp) ?? CONTACT.phoneE164,
      address: str(company.address) ?? ADDRESS.full,
      latitude: typeof company.latitude === "number" ? company.latitude : GEO.latitude,
      longitude: typeof company.longitude === "number" ? company.longitude : GEO.longitude,
    };
  },
  ["site-contact"],
  { revalidate: 3600, tags: ["settings", "public"] },
);

/**
 * Opening hours, keyed `mon`…`sun`.
 *
 * Absent days are genuinely absent, not "closed" — CLAUDE.md §3 lists hours as
 * TODO(client), and publishing a guessed closing time on a yard customers
 * drive to is worse than publishing none.
 */
export const getOpeningHours = unstable_cache(
  async (): Promise<OpeningHours> => {
    const s = await readSettings();
    const raw = s.opening_hours ?? {};
    const out: OpeningHours = {};
    for (const [k, v] of Object.entries(raw)) {
      const val = str(v);
      if (val) out[k] = val;
    }
    return out;
  },
  ["opening-hours"],
  { revalidate: 3600, tags: ["settings", "public"] },
);
