"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadStatusUpdateSchema, leadNoteSchema } from "@/lib/validation/admin";

/**
 * Lead pipeline mutations.
 *
 * Every action re-authorises with `requireAdmin()` before touching the
 * service-role client. A Server Action is a public HTTP endpoint, so the
 * page-level guard is not sufficient on its own.
 */

async function logEvent(
  leadId: string,
  actorId: string,
  event: "status_changed" | "note" | "assigned",
  data: Record<string, unknown> = {},
) {
  const supabase = createAdminClient();
  await supabase.from("lead_events").insert({ lead_id: leadId, actor_id: actorId, event, data });
}

export async function updateLeadStatus(input: { leadId: string; status: string }) {
  const user = await requireAdmin();
  const parsed = leadStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { leadId, status } = parsed.data;

  const supabase = createAdminClient();
  const patch: Record<string, unknown> = { status };

  if (status === "contacted") {
    // Stamp first contact once only. If a lead is moved back to `new` and
    // contacted again, overwriting this would make "time to first response"
    // look better than it was.
    const { data: existing } = await supabase
      .from("leads")
      .select("contacted_at")
      .eq("id", leadId)
      .maybeSingle();
    if (!existing?.contacted_at) patch.contacted_at = new Date().toISOString();
  }

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
  if (error) return { error: error.message };

  await logEvent(leadId, user.id, "status_changed", { status });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

export async function addLeadNote(input: { leadId: string; note: string }) {
  const user = await requireAdmin();
  const parsed = leadNoteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid note" };

  const supabase = createAdminClient();
  // Notes go on the timeline, and the latest also lands in `staff_notes` so the
  // detail view can show it without replaying every event.
  await logEvent(parsed.data.leadId, user.id, "note", { note: parsed.data.note });
  const { error } = await supabase
    .from("leads")
    .update({ staff_notes: parsed.data.note })
    .eq("id", parsed.data.leadId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/leads/${parsed.data.leadId}`);
  return { ok: true };
}

export async function assignLeadToMe(leadId: string) {
  const user = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").update({ assigned_to: user.id }).eq("id", leadId);
  if (error) return { error: error.message };
  await logEvent(leadId, user.id, "assigned", { assigned_to: user.id });
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

/**
 * Quarantine, not delete.
 *
 * The previous implementation set status to `lost`, which buried spam in the
 * same bucket as genuine lost business and made the lost count meaningless.
 * There is a real `spam` status now, with its own inbox tab — a false positive
 * has to stay recoverable, because it is a real customer.
 */
export async function markLeadSpam(leadId: string) {
  const user = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").update({ status: "spam" }).eq("id", leadId);
  if (error) return { error: error.message };
  await logEvent(leadId, user.id, "status_changed", { status: "spam" });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

export async function deleteLead(leadId: string): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}
