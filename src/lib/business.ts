/**
 * Business facts.
 *
 * CLAUDE.md §3 is the ONLY authorised source for anything in this file.
 * Nothing here may be inferred, rounded or filled in from a competitor's site.
 * If a value is not in §3 it is `null` and the page renders nothing or an
 * explicit placeholder — an invented bond, licence condition or opening hour
 * on a live page is a consumer-law problem, not a typo.
 *
 * Contact details (phone, email, address, hours) are operator-editable and
 * come from the `settings` table so they can change without a deploy. The
 * constants below are the ones that are contractual or structural.
 */

export const BRAND = {
  name: "XPDX Rentals",
  tagline: "Rent · Drive · Thrive",
  /** Long-term cargo van hire for Sydney trades, couriers and businesses. */
  positioning: "Long-term cargo van hire for Sydney trades, couriers and businesses",
} as const;

/** Confirmed by the client, 4 August 2026. */
export const HIRE_TERMS = {
  /** Exactly 28 days. Never "1 month", never "4 weeks". */
  minHireDays: 28,
  bondAud: 750,
  /** Reduced bond when the hirer connects their own toll account. */
  bondWithTollAccountAud: 500,
  minDriverAge: 21,
  minLicenceMonths: 12,
  /** Approved for use within NSW; interstate by prior arrangement only. */
  stateOfUse: "New South Wales",
} as const;

/** Included in every hire, per §3. */
export const INCLUSIONS: string[] = [
  "Comprehensive insurance",
  "Unlimited kilometres",
  "24/7 roadside assistance",
  "Scheduled servicing and maintenance",
  "Ongoing team support",
  "GPS tracking",
];

/** All vans, per §3. */
export const FLEET_COMMON = {
  transmission: "Automatic",
  fuel: "Diesel",
  fitout: "Cargo fit-out with bulkhead, reverse camera, GPS tracked",
} as const;

/**
 * Geo for LocalBusiness structured data. Overridden by `settings` when the
 * operator sets it; these are the §3 values seeded in migration 0019.
 */
export const GEO = { latitude: -33.9325502, longitude: 151.0131701 } as const;

export const ADDRESS = {
  street: "16 Ilma Street",
  suburb: "Condell Park",
  state: "NSW",
  postcode: "2200",
  country: "AU",
  full: "16 Ilma Street, Condell Park NSW 2200",
} as const;

/**
 * Contact details from §3. These are operator-editable in `settings`; these
 * constants are the fallback when settings has no value yet, so the highest
 * value control on the site — the phone number — is never missing. Both are
 * authorised by §3 and are the numbers seeded in migration 0019.
 */
export const CONTACT = {
  phoneDisplay: "0433 418 566",
  /** Digits only, country code first, for tel: and wa.me. */
  phoneE164: "61433418566",
} as const;

export const SOCIALS = {
  instagram: "https://www.instagram.com/xpdxrentals/",
  facebook: "https://www.facebook.com/profile.php?id=61566015290728",
} as const;

/**
 * Not supplied by the client. Rendered as nothing, or as an explicit
 * placeholder — never guessed. Tracked in docs/handover.md.
 */
export const TODO_CLIENT = {
  openingHours: null,
  abn: null,
  /** Per-van load volume (m³) and payload (kg). */
  loadVolumeAndPayload: null,
  /** `info@xpdx.com.au` is a placeholder the client will change. */
  email: null,
} as const;
