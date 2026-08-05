import { z } from "zod";
import { VAN_STATUSES, ROOF_HEIGHTS } from "@/lib/van";

/**
 * Van editor validation. This is the authority — the client form is a
 * convenience (CLAUDE.md §1.7: Zod at every boundary).
 *
 * Values arrive from a Server Action as FormData, so everything is a string
 * until coerced. Empty strings mean "not supplied" and become null rather than
 * 0 or "": a missing payload figure must stay missing, because §1.6 forbids
 * publishing a guessed number and 0 kg would be a published guess.
 */

const optionalInt = (max: number) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" ? null : Number(s);
    })
    .refine((v) => v === null || (Number.isInteger(v) && v > 0 && v <= max), {
      message: `Must be a whole number between 1 and ${max}`,
    });

const optionalDecimal = (max: number) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" ? null : Number(s);
    })
    .refine((v) => v === null || (Number.isFinite(v) && v > 0 && v <= max), {
      message: `Must be a number between 0 and ${max}`,
    });

const requiredText = (field: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(max, `${field} must be ${max} characters or fewer`);

const optionalText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      const s = (v ?? "").toString().trim();
      return s === "" ? null : s;
    })
    .refine((v) => v === null || v.length <= max, {
      message: `Must be ${max} characters or fewer`,
    });

export const vanSchema = z.object({
  // ── Identity ──
  name: requiredText("Name"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80, "Slug must be 80 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers and single hyphens",
    ),
  bodyType: requiredText("Body type", 60),
  wheelbaseLabel: requiredText("Wheelbase", 20),
  roof: z.enum(ROOF_HEIGHTS as [string, ...string[]]),
  tonnage: z.coerce
    .number({ message: "Tonnage is required" })
    .positive("Tonnage must be greater than zero")
    .max(99.9, "Tonnage looks wrong"),
  transmission: requiredText("Transmission", 40),
  fuel: requiredText("Fuel", 40),
  seats: optionalInt(20),

  // ── Pricing ──
  priceWeeklyFrom: z.coerce
    .number({ message: "Weekly rate is required" })
    .int("Weekly rate must be a whole number of dollars")
    .positive("Weekly rate must be greater than zero")
    .max(100000, "Weekly rate looks wrong"),
  priceMonthlyFrom: optionalInt(1000000),
  // 28 days is the contractual minimum everywhere on the site. No page may
  // imply daily or weekly hire is available (CLAUDE.md §3, "Resolved"), so the
  // editor cannot set a shorter term.
  minHireDays: z.coerce
    .number()
    .int()
    .min(28, "Minimum hire is 28 days — the site must never imply shorter")
    .max(365, "Minimum hire looks wrong")
    .default(28),
  priceVerified: z.coerce.boolean().default(false),

  // ── Specs ──
  lengthMm: optionalInt(20000),
  heightMm: optionalInt(5000),
  widthMm: optionalInt(5000),
  wheelbaseMm: optionalInt(10000),
  loadVolumeM3: optionalDecimal(999.9),
  payloadKg: optionalInt(10000),
  dimensionsVerified: z.coerce.boolean().default(false),

  // ── Content / SEO ──
  features: z.array(z.string().trim().min(1)).max(40).default([]),
  summary: optionalText(300),
  description: optionalText(8000),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),

  // ── Lifecycle ──
  status: z.enum(VAN_STATUSES as [string, ...string[]]).default("draft"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export type VanInput = z.infer<typeof vanSchema>;

/**
 * Image metadata. `alt` is required and may not be blank — this is an SEO site
 * whose audience often works outdoors on poor screens, and CLAUDE.md §7 makes
 * blank alt a validation failure. The database enforces the same rule.
 */
export const vanImageSchema = z.object({
  alt: z
    .string()
    .trim()
    .min(1, "Alt text is required on every image")
    .max(200, "Alt text must be 200 characters or fewer"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isPrimary: z.coerce.boolean().default(false),
});

export type VanImageInput = z.infer<typeof vanImageSchema>;

/** Parses a `features` textarea — one feature per line, blanks dropped. */
export function parseFeaturesTextarea(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}
