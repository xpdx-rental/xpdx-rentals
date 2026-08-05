import type { EnquiryInput } from "@/lib/validation/lead";
import { checkSpam, normalizePhone } from "@/lib/leads/spam-check";
import type { ChannelResult, EnquiryNotification } from "@/lib/leads/channels";

/**
 * The enquiry pipeline — CLAUDE.md §9.
 *
 *     validate → insert → respond → notify
 *
 * Dependencies are injected rather than imported so the contract that matters
 * can actually be tested: **a broken notifier must not lose a lead, must not
 * fail the request, and must not prevent the insert.** See
 * `submit-enquiry.test.ts`, which breaks the notifier on purpose.
 *
 * The ordering is not stylistic. Persist happens before the caller is
 * acknowledged, so a crash after acknowledgement cannot lose an enquiry.
 * Notification happens strictly after, so a dead SMTP host cannot turn a
 * captured lead into a customer-facing error.
 */

export type LeadRow = Record<string, unknown>;

export type EnquiryDeps = {
  /** Resolves a van slug to an id. Returns null when unknown. */
  findVanIdBySlug(slug: string): Promise<string | null>;
  /** Atomic lead + `created` event. Returns the new lead id. */
  insertLead(row: LeadRow): Promise<{ leadId: string | null; error: string | null }>;
  /** Records a `notified` event. Best-effort; must not throw. */
  recordNotified(leadId: string, results: ChannelResult[]): Promise<void>;
  /** Dispatches to every channel. Must not throw. */
  notify(input: EnquiryNotification): Promise<ChannelResult[]>;
  /** Salted hash of the caller's IP. Never a raw IP. */
  ipHash: string;
};

export type EnquiryOutcome =
  | { ok: true; leadId: string; quarantined: boolean; runNotify: () => Promise<void> }
  | { ok: false; status: number; message: string };

export function buildLeadRow(
  data: EnquiryInput,
  opts: { phone: string; vanId: string | null; ipHash: string; quarantined: boolean },
): LeadRow {
  const meta = data.meta ?? {};
  return {
    name: data.name,
    phone: opts.phone,
    email: data.email,
    suburb: data.suburb || null,
    van_id: opts.vanId,
    van_slug_raw: data.vanSlug || null,
    duration: data.duration || null,
    start_date: data.startDate || null,
    message: data.message || null,
    source: "website",
    page_path: meta.pagePath ?? null,
    referrer: meta.referrer ?? null,
    utm: meta.utm ?? {},
    ip_hash: opts.ipHash,
    device: meta.device ?? "unknown",
    consent: { given: data.consent === true, at: new Date().toISOString() },
    payload: {},
    status: opts.quarantined ? "spam" : "new",
  };
}

/**
 * Runs validate → insert and returns a `runNotify` thunk for the caller to
 * schedule AFTER the response has been sent.
 *
 * Returning the thunk rather than awaiting it here is what keeps the ordering
 * honest: this function cannot accidentally block the response on a network
 * call to a mail server.
 */
export async function submitEnquiry(
  data: EnquiryInput,
  deps: EnquiryDeps,
): Promise<EnquiryOutcome> {
  const phone = normalizePhone(data.phone);

  // Honeypot + time-to-submit + disposable email. No CAPTCHA (§9): it costs
  // conversions, and this audience fills forms on a phone in a yard.
  //
  // Spam is QUARANTINED, not rejected — stored with status 'spam' and still
  // acknowledged with success. A bot is never taught what tripped the filter,
  // and a false positive is still captured and still visible to staff in the
  // Spam tab. A rejected false positive is a lost customer.
  const spam = checkSpam({
    website: data.website,
    formRenderedAt: data.formRenderedAt,
    email: data.email,
  });

  let vanId: string | null = null;
  if (data.vanSlug) {
    try {
      vanId = await deps.findVanIdBySlug(data.vanSlug);
    } catch {
      // A van lookup failure must not cost us the lead — `van_slug_raw` still
      // records what the customer enquired about.
      vanId = null;
    }
  }

  const row = buildLeadRow(data, {
    phone,
    vanId,
    ipHash: deps.ipHash,
    quarantined: spam.isSpam,
  });

  // Durable persist BEFORE acknowledging. Nothing past this line may cause the
  // customer to be told their enquiry failed.
  const { leadId, error } = await deps.insertLead(row);
  if (error || !leadId) {
    return {
      ok: false,
      status: 500,
      message: "We could not save your enquiry. Please call us and we'll take the details.",
    };
  }

  const runNotify = async () => {
    // Genuine leads only — never notify staff about quarantined spam.
    if (spam.isSpam) return;
    try {
      const results = await deps.notify({
        leadId,
        name: data.name,
        phone,
        email: data.email,
        suburb: data.suburb || null,
        vanSlug: data.vanSlug || null,
        duration: data.duration || null,
        message: data.message || null,
        pagePath: data.meta?.pagePath ?? null,
      });
      if (results.some((r) => r.sent)) {
        await deps.recordNotified(leadId, results);
      }
    } catch {
      // Deliberately swallowed, and deliberately last. The lead is already
      // durable; this is the whole point of the ordering.
    }
  };

  return { ok: true, leadId, quarantined: spam.isSpam, runNotify };
}
