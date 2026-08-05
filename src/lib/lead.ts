/**
 * XPDX lead domain — the product. Mirrors `leads` / `lead_events` in
 * supabase/migrations/0019_xpdx_core.sql.
 *
 * There is one kind of enquiry now. The inherited schema had eight lead types
 * (eight distinct funnels, each with its own form); a van hire
 * business has one conversion action, so `type` is gone and the pipeline is
 * six states instead of eight.
 */

export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost" | "spam";

/** Pipeline order as staff work it. `spam` is not part of the flow. */
export const LEAD_STATUS_ORDER: LeadStatus[] = ["new", "contacted", "quoted", "won", "lost"];

export const LEAD_STATUSES: LeadStatus[] = [...LEAD_STATUS_ORDER, "spam"];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
  spam: "Spam",
};

export const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-primary/15 text-primary",
  contacted: "bg-info/15 text-info",
  quoted: "bg-warning/15 text-warning",
  won: "bg-success/15 text-success",
  lost: "bg-muted text-muted-foreground",
  spam: "bg-danger/15 text-danger",
};

export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  suburb: string | null;

  vanId: string | null;
  /** Survives a van deletion, so an enquiry never loses what it was about. */
  vanSlugRaw: string | null;
  /** Denormalised for the inbox; not a column. */
  vanName: string | null;

  duration: string | null;
  startDate: string | null;
  message: string | null;

  source: string;
  pagePath: string | null;
  referrer: string | null;
  utm: Record<string, unknown>;
  device: DeviceType | null;

  status: LeadStatus;
  staffNotes: string | null;
  assignedTo: string | null;
  contactedAt: string | null;
  createdAt: string;
};

export type LeadEvent = {
  id: string;
  leadId: string;
  actorId: string | null;
  event: "created" | "status_changed" | "note" | "assigned" | "notified";
  data: Record<string, unknown>;
  createdAt: string;
};

// ── Phone helpers ───────────────────────────────────────────────────────────
// Staff work the inbox on a phone, so `tel:` and `wa.me` must be one tap
// (CLAUDE.md §7 screen 1). Both are derived from the stored E.164 number.

/**
 * `tel:` href in E.164 — CLAUDE.md §3 specifies `0433 418 566` →
 * `tel:+61433418566`.
 *
 * A local `tel:0433418566` dials fine from an Australian handset but breaks
 * for anyone roaming or with a non-AU SIM, and it is not what §3 asks for.
 * Australian mobile and landline numbers are normalised; anything already
 * international is passed through.
 */
export function telHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return `tel:${cleaned}`;
  const digits = cleaned.replace(/\D/g, "");
  // 61XXXXXXXXX → +61XXXXXXXXX
  if (digits.startsWith("61") && digits.length === 11) return `tel:+${digits}`;
  // 0XXXXXXXXX → +61XXXXXXXXX (drop the trunk zero)
  if (digits.startsWith("0") && digits.length === 10) return `tel:+61${digits.slice(1)}`;
  return `tel:${cleaned}`;
}

/**
 * `+61433418566` → `https://wa.me/61433418566`.
 * wa.me wants digits only, no plus.
 */
export function waHref(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Readable AU grouping for display only — never for `tel:`. */
export function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  // 61433418566 → 0433 418 566
  if (d.startsWith("61") && d.length === 11) {
    const local = `0${d.slice(2)}`;
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  if (d.length === 10 && d.startsWith("0")) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  return phone;
}
