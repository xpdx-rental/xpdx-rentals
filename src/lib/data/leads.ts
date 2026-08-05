import { createAdminClient } from "@/lib/supabase/admin";
import type { Lead, LeadEvent, LeadStatus } from "@/lib/lead";
import type { LeadEventRow, LeadRow } from "@/lib/data/rows";

/**
 * Lead pipeline reads for the staff inbox.
 *
 * Called only after a page-level `requireAdmin()`, so the admin
 * (service-role) client is used. RLS is the backstop, not the gate — see
 * `src/lib/security/auth.ts`.
 */

const LEAD_SELECT = `
  id, name, phone, email, suburb, van_id, van_slug_raw, duration, start_date,
  message, source, page_path, referrer, utm, device, status, staff_notes,
  assigned_to, contacted_at, created_at,
  vans:van_id ( name )
`;

function toLead(r: LeadRow): Lead {
  // PostgREST returns a to-one embed as an object or a one-element array
  // depending on version. Normalise both, or the van name silently vanishes.
  const vanRel = r.vans;
  const van = Array.isArray(vanRel) ? vanRel[0] : vanRel;

  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    suburb: r.suburb ?? null,
    vanId: r.van_id ?? null,
    vanSlugRaw: r.van_slug_raw ?? null,
    vanName: van?.name ?? null,
    duration: r.duration ?? null,
    startDate: r.start_date ?? null,
    message: r.message ?? null,
    source: r.source ?? "website",
    pagePath: r.page_path ?? null,
    referrer: r.referrer ?? null,
    utm: r.utm ?? {},
    device: r.device ?? null,
    status: r.status as LeadStatus,
    staffNotes: r.staff_notes ?? null,
    assignedTo: r.assigned_to ?? null,
    contactedAt: r.contacted_at ?? null,
    createdAt: r.created_at,
  };
}

export async function getLeadList(filters?: {
  status?: LeadStatus;
  vanId?: string;
  q?: string;
}): Promise<Lead[]> {
  const supabase = createAdminClient();
  let q = supabase
    .from("leads")
    .select(LEAD_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);

  // Spam is quarantined out of the default view but reachable via its own tab,
  // because a false positive is a lost customer and staff must be able to look.
  if (filters?.status) q = q.eq("status", filters.status);
  else q = q.neq("status", "spam");

  if (filters?.vanId) q = q.eq("van_id", filters.vanId);
  if (filters?.q) {
    const term = filters.q.replace(/[%,()]/g, "").trim();
    if (term) {
      // Search name, phone and email. Phone is stored E.164, so strip the
      // formatting a human types before matching against it.
      const digits = term.replace(/\D/g, "");
      const clauses = [`name.ilike.%${term}%`, `email.ilike.%${term}%`];
      if (digits) clauses.push(`phone.ilike.%${digits}%`);
      q = q.or(clauses.join(","));
    }
  }

  const { data } = await q;
  return ((data ?? []) as LeadRow[]).map(toLead);
}

/** Counts per status, for the inbox tab badges. */
export async function getLeadStatusCounts(): Promise<Record<string, number>> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("leads").select("status");
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Pick<LeadRow, "status">[]) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}

export async function getLeadDetail(
  id: string,
): Promise<{ lead: Lead; events: LeadEvent[] } | null> {
  const supabase = createAdminClient();
  const { data: leadRow } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (!leadRow) return null;

  const { data: eventRows } = await supabase
    .from("lead_events")
    .select("id, lead_id, actor_id, event, data, created_at")
    .eq("lead_id", id)
    .order("created_at", { ascending: true });

  const events: LeadEvent[] = ((eventRows ?? []) as LeadEventRow[]).map((e) => ({
    id: e.id,
    leadId: e.lead_id,
    actorId: e.actor_id ?? null,
    event: e.event,
    data: e.data ?? {},
    createdAt: e.created_at,
  }));

  return { lead: toLead(leadRow as LeadRow), events };
}
