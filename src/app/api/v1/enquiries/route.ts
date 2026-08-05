import { NextRequest, NextResponse, after } from "next/server";
import { enquirySchema } from "@/lib/validation/lead";
import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";
import { hashIp, clientIp } from "@/lib/leads/spam-check";
import { notifyAllChannels } from "@/lib/leads/channels";
import { submitEnquiry } from "@/lib/leads/submit-enquiry";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * The enquiry endpoint. This is the whole business model — CLAUDE.md §4:
 * "A lead must never be lost to a client-side error, a failed third-party
 * call, or a validation edge case."
 *
 * Order of operations (§9): **validate → insert → respond → notify.**
 *
 * The notification runs inside `after()`, which Next executes once the response
 * has been sent. Previously it was awaited before the 201, which meant a slow
 * or dead SMTP host became user-visible latency on the one interaction that
 * earns this business money. It could never have lost a lead — the insert came
 * first — but it could have made a captured lead feel like a failure.
 *
 * The pipeline itself lives in `lib/leads/submit-enquiry.ts` with injected
 * dependencies, so the contract is covered by tests that deliberately break the
 * notifier. This file is only the HTTP edge.
 */
export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "We could not read that request." } },
      { status: 400 },
    );
  }

  const parsed = enquirySchema.safeParse(json);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json(
      { data: null, error: { message: "Please check the highlighted fields.", fields } },
      { status: 400 },
    );
  }

  const ip = clientIp(request.headers);
  const ipHash = hashIp(ip);

  // Rate limit by IP and by phone: 5 per 10 minutes each. Phone as well as IP,
  // because a single bad actor behind CGNAT shares an IP with real customers.
  const phoneKey = parsed.data.phone.replace(/\D/g, "");
  for (const key of [`enquiry:ip:${ipHash}`, `enquiry:phone:${phoneKey}`]) {
    const rl = await rateLimitSlidingWindow(key, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          data: null,
          error: { message: "You've sent a few enquiries already. Please call us instead." },
        },
        {
          status: 429,
          headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined,
        },
      );
    }
  }

  const supabase = createAdminClient();

  const outcome = await submitEnquiry(parsed.data, {
    ipHash,
    async findVanIdBySlug(slug) {
      const { data } = await supabase.from("vans").select("id").eq("slug", slug).maybeSingle();
      return data?.id ?? null;
    },
    async insertLead(row) {
      const { data, error } = await supabase.rpc("create_lead_with_event", { p_lead: row });
      return { leadId: (data as string | null) ?? null, error: error?.message ?? null };
    },
    async recordNotified(leadId, results) {
      try {
        await supabase
          .from("lead_events")
          .insert({ lead_id: leadId, event: "notified", data: { channels: results } });
      } catch {
        // A missing timeline entry is not worth surfacing anywhere.
      }
    },
    notify: notifyAllChannels,
  });

  if (!outcome.ok) {
    // Failure copy states what happened and gives them a way through. Never a
    // bare "something went wrong" — this form is how the business earns money.
    return NextResponse.json(
      { data: null, error: { message: outcome.message } },
      { status: outcome.status },
    );
  }

  // Schedule notification for AFTER the response is flushed.
  after(outcome.runNotify);

  // Spam is acknowledged exactly like a genuine lead so bots learn nothing.
  return NextResponse.json({ data: { ok: true }, error: null }, { status: 201 });
}
