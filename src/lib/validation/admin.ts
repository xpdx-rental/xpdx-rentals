import { z } from "zod";

/** Admin: settings (per-key), redirects, lead pipeline actions. */

export const financeParamsSchema = z.object({
  annualRate: z.coerce.number().min(0).max(100),
  termMonths: z.coerce.number().int().min(1).max(120),
  depositPct: z.coerce.number().min(0).max(100),
  disclaimer: z.string().trim().min(10).max(1000),
});

export const companyProfileSchema = z.object({
  legalName: z.string().trim().min(1).max(200),
  tradingName: z.string().trim().min(1).max(200),
  abn: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(160),
  googleRating: z.coerce.number().min(0).max(5).optional(),
  googleReviewCount: z.coerce.number().int().nonnegative().optional(),
});

export const notificationRecipientsSchema = z.object({
  emails: z.array(z.string().email()).max(20),
});

export const redirectSchema = z.object({
  id: z.string().uuid().optional(),
  fromPath: z.string().trim().startsWith("/").max(2048),
  toPath: z.string().trim().min(1).max(2048),
  code: z.coerce.number().int().refine((c) => [301, 302, 307, 308, 410].includes(c), {
    message: "code must be 301, 302, 307, 308, or 410",
  }),
});

/** Lead pipeline mutation. */
export const leadStatusUpdateSchema = z
  .object({
    leadId: z.string().uuid(),
    // Six states, matching the lead_status enum in migration 0019. The
    // inherited pipeline's qualified / inspection_scheduled / negotiation
    // stages and its loss_reason taxonomy went with the funnel they modelled.
    status: z.enum(["new", "contacted", "quoted", "won", "lost", "spam"]),
  });

export const leadNoteSchema = z.object({
  leadId: z.string().uuid(),
  note: z.string().trim().min(1).max(4000),
});

export const leadAssignSchema = z.object({
  leadId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
});

export const staffRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "manager", "hire_desk", "content"]),
  active: z.boolean().optional().default(true),
});

export type FinanceParamsInput = z.infer<typeof financeParamsSchema>;
export type RedirectInput = z.infer<typeof redirectSchema>;
export type LeadStatusUpdateInput = z.infer<typeof leadStatusUpdateSchema>;
