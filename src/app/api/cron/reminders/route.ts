import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendUnreadLeadReminderEmail } from "@/lib/email/ses";

/**
 * Staff reminder: enquiries still `new` after 24 hours.
 *
 * Phase 1 (strip) rewrote this route. It previously queried `organizations`,
 * `leads.organization_id` and `vehicles.status = 'pending'` — none of which
 * exist in this schema — so the pending-approvals half was dead on arrival and
 * the vendor-reminder half could never have found a recipient. Both were
 * rental-marketplace leftovers.
 *
 * MUST be protected by a cron secret in all environments. Fail-closed: if
 * CRON_SECRET is not configured, no one can trigger this endpoint — better to
 * miss a reminder than to allow unauthenticated access to admin operations.
 *
 * Note `vercel.json` registers no crons, so this needs an external scheduler.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "new")
    .lt("created_at", twentyFourHoursAgo);

  if (!count) {
    return NextResponse.json({ success: true, results: { unread: 0, remindersSent: 0 } });
  }

  // Recipients live in the `settings` key/value store so staff can change them
  // without a deploy.
  const { data: setting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "notification_recipients")
    .maybeSingle();

  const recipients = (
    ((setting?.value as { emails?: string[] } | null)?.emails ?? []) as string[]
  ).filter(Boolean);

  let remindersSent = 0;
  for (const to of recipients) {
    const res = await sendUnreadLeadReminderEmail({ to, unreadCount: count });
    if (!res.skipped) remindersSent++;
  }

  return NextResponse.json({ success: true, results: { unread: count, remindersSent } });
}
