import { z } from "zod";
import { DURATIONS } from "@/lib/enquiry-options";

export { DURATIONS } from "@/lib/enquiry-options";

/**
 * The enquiry schema — the one conversion action on the site.
 *
 * Shared between client and server. The client copy is a convenience; the
 * server one is the authority (CLAUDE.md §9).
 *
 * Phase 4 replaced the inherited version: a discriminated union over eight
 * lead types, one per funnel the previous product ran. A van hire business has
 * one funnel, so it has one schema.
 */

const auPhone = z
  .string()
  .trim()
  .min(1, "Please enter a phone number")
  .refine(
    (v) => {
      const d = v.replace(/\D/g, "");
      // 04xxxxxxxx / 0[2378]xxxxxxxx, or the 61-prefixed equivalents.
      return /^(0[234785]\d{8}|61[234785]\d{8})$/.test(d);
    },
    { message: "Please enter a valid Australian phone number" },
  );

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: auPhone,
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  suburb: z.string().trim().max(120).optional().or(z.literal("")),

  vanSlug: z.string().trim().max(80).optional().or(z.literal("")),
  duration: z.enum(DURATIONS).optional(),
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please use the date picker")
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),

  consent: z.literal(true, { message: "Please agree to be contacted about this enquiry" }),

  // ── Anti-spam (CLAUDE.md §9: honeypot plus a timing check, no CAPTCHA) ──
  /** Honeypot. Must stay empty; real users never see this field. */
  website: z.string().max(0).optional().or(z.literal("")),
  /** Epoch ms when the form rendered, for the time-to-submit check. */
  formRenderedAt: z.coerce.number().optional(),

  /** Attribution, filled in by the client. */
  meta: z
    .object({
      pagePath: z.string().max(512).optional(),
      referrer: z.string().max(1024).optional(),
      device: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
      utm: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
