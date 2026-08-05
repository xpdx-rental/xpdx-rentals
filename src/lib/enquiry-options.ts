/**
 * Enquiry form options.
 *
 * In their own module with NO imports, deliberately.
 *
 * `DURATIONS` used to live in `lib/validation/lead.ts` alongside the Zod
 * schema. The client `EnquiryForm` imported the constant from there, which
 * dragged Zod into the browser bundle: 65KB over the wire on every page with a
 * form, for a list of six strings.
 *
 * The client never validates with Zod — the form is `noValidate`, uses native
 * `required`, and renders field errors returned by the server, which is the
 * authority (CLAUDE.md §9). So Zod belongs on the server only.
 *
 * Keep this file dependency-free.
 */

/** Every option respects the 28-day minimum hire. */
export const DURATIONS = [
  "1 month",
  "2-3 months",
  "3-6 months",
  "6-12 months",
  "12 months or more",
  "Not sure yet",
] as const;

export type Duration = (typeof DURATIONS)[number];
