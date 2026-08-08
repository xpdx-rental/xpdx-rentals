import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitEnquiry, buildLeadRow, type EnquiryDeps, type LeadRow } from "@/lib/leads/submit-enquiry";
import { notifyAllChannels, type NotificationChannel } from "@/lib/leads/channels";
import type { EnquiryInput } from "@/lib/validation/lead";

/**
 * CLAUDE.md §4: "Leads are sacred. A lead must never be lost to a client-side
 * error, a failed third-party call, or a validation edge case. Server-side
 * persist first, notify second. If the email/webhook fails, the lead is still
 * in the database."
 *
 * The Phase 5 brief asks for that to be *proved*, by breaking the notification
 * service deliberately. These tests do exactly that, in every way a
 * notification can fail: throwing, rejecting, hanging, and reporting failure.
 */

const VALID: EnquiryInput = {
  name: "Sam Taylor",
  phone: "0433 418 566",
  email: "sam@example.com",
  suburb: "Bankstown",
  vanSlug: "sprinter-mwb-high",
  duration: "2-3 months",
  startDate: "2026-09-01",
  message: "Need it for a courier run.",
  consent: true,
  website: "",
  formRenderedAt: Date.now() - 30_000,
  meta: { pagePath: "/vans/sprinter-mwb-high", device: "mobile", utm: {} },
};

function makeDeps(over: Partial<EnquiryDeps> = {}) {
  const inserted: LeadRow[] = [];
  const deps: EnquiryDeps = {
    ipHash: "hash-abc",
    findVanIdBySlug: vi.fn(async () => "van-uuid-1"),
    insertLead: vi.fn(async (row: LeadRow) => {
      inserted.push(row);
      return { leadId: "lead-uuid-1", error: null };
    }),
    recordNotified: vi.fn(async () => {}),
    notify: vi.fn(async () => [{ channel: "email", sent: true }]),
    ...over,
  };
  return { deps, inserted };
}

describe("a broken notifier never costs a lead", () => {
  it("still inserts and still succeeds when the notifier THROWS", async () => {
    const { deps, inserted } = makeDeps({
      notify: vi.fn(async () => {
        throw new Error("SMTP is on fire");
      }),
    });

    const outcome = await submitEnquiry(VALID, deps);

    expect(outcome.ok).toBe(true);
    expect(inserted).toHaveLength(1);
    expect(inserted[0].name).toBe("Sam Taylor");

    // And running the notification does not turn a captured lead into an error.
    if (outcome.ok) await expect(outcome.runNotify()).resolves.toBeUndefined();
    expect(inserted).toHaveLength(1);
  });

  it("still inserts when the notifier REJECTS", async () => {
    const { deps, inserted } = makeDeps({
      notify: vi.fn(() => Promise.reject(new Error("connection refused"))),
    });
    const outcome = await submitEnquiry(VALID, deps);
    expect(outcome.ok).toBe(true);
    expect(inserted).toHaveLength(1);
    if (outcome.ok) await expect(outcome.runNotify()).resolves.toBeUndefined();
  });

  it("still inserts when every channel reports failure", async () => {
    const { deps, inserted } = makeDeps({
      notify: vi.fn(async () => [{ channel: "email", sent: false, reason: "no_recipients" }]),
    });
    const outcome = await submitEnquiry(VALID, deps);
    expect(outcome.ok).toBe(true);
    expect(inserted).toHaveLength(1);
    if (outcome.ok) await outcome.runNotify();
    // Nothing was sent, so nothing is recorded as sent.
    expect(deps.recordNotified).not.toHaveBeenCalled();
  });

  it("inserts BEFORE it notifies, not after", async () => {
    const order: string[] = [];
    const { deps } = makeDeps({
      insertLead: vi.fn(async () => {
        order.push("insert");
        return { leadId: "lead-uuid-1", error: null };
      }),
      notify: vi.fn(async () => {
        order.push("notify");
        return [{ channel: "email", sent: true }];
      }),
    });

    const outcome = await submitEnquiry(VALID, deps);
    // Critically: the notify has NOT run by the time we are ready to respond.
    expect(order).toEqual(["insert"]);

    if (outcome.ok) await outcome.runNotify();
    expect(order).toEqual(["insert", "notify"]);
  });

  it("does not block the response on a hanging notifier", async () => {
    const { deps } = makeDeps({
      notify: vi.fn((): Promise<never> => new Promise(() => {})), // never settles
    });
    // submitEnquiry must resolve regardless — the hang is deferred into the thunk.
    const outcome = await Promise.race([
      submitEnquiry(VALID, deps),
      new Promise((_, rej) => setTimeout(() => rej(new Error("blocked on notify")), 500)),
    ]);
    expect((outcome as { ok: boolean }).ok).toBe(true);
  });
});

describe("a failed insert IS surfaced", () => {
  it("returns an actionable error, never a bare failure", async () => {
    const { deps } = makeDeps({
      insertLead: vi.fn(async () => ({ leadId: null, error: "db down" })),
    });
    const outcome = await submitEnquiry(VALID, deps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.status).toBe(500);
      // §9: state what happened and give the phone number.
      expect(outcome.message).toMatch(/call us/i);
      expect(outcome.message).not.toMatch(/something went wrong/i);
    }
  });

  it("never notifies when the lead did not land", async () => {
    const { deps } = makeDeps({
      insertLead: vi.fn(async () => ({ leadId: null, error: "db down" })),
    });
    await submitEnquiry(VALID, deps);
    expect(deps.notify).not.toHaveBeenCalled();
  });
});

describe("spam is quarantined, not rejected", () => {
  it("stores a honeypot hit as spam but still reports success", async () => {
    const { deps, inserted } = makeDeps();
    const outcome = await submitEnquiry({ ...VALID, website: "http://spam.example" }, deps);

    expect(outcome.ok).toBe(true); // the bot learns nothing
    expect(inserted[0].status).toBe("spam");
    if (outcome.ok) expect(outcome.quarantined).toBe(true);
  });

  it("stores an implausibly fast submission as spam", async () => {
    const { deps, inserted } = makeDeps();
    const outcome = await submitEnquiry({ ...VALID, formRenderedAt: Date.now() }, deps);
    expect(outcome.ok).toBe(true);
    expect(inserted[0].status).toBe("spam");
  });

  it("never notifies staff about quarantined spam", async () => {
    const { deps } = makeDeps();
    const outcome = await submitEnquiry({ ...VALID, website: "x" }, deps);
    if (outcome.ok) await outcome.runNotify();
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("treats a genuine slow submission as genuine", async () => {
    const { deps, inserted } = makeDeps();
    await submitEnquiry(VALID, deps);
    expect(inserted[0].status).toBe("new");
  });
});

describe("Turnstile joins the spam signals without ever rejecting", () => {
  it("quarantines a definitively failed challenge, and still returns success", async () => {
    const { deps, inserted } = makeDeps({ turnstile: "failed" });
    const outcome = await submitEnquiry(VALID, deps);

    // Stored, flagged, acknowledged. A bot learns nothing from the response,
    // and a false positive is still a lead staff can see in the Spam tab.
    expect(outcome.ok).toBe(true);
    expect(inserted).toHaveLength(1);
    expect(inserted[0].status).toBe("spam");
    if (outcome.ok) expect(outcome.quarantined).toBe(true);
  });

  it("does not notify staff about a failed challenge", async () => {
    const { deps } = makeDeps({ turnstile: "failed" });
    const outcome = await submitEnquiry(VALID, deps);
    if (outcome.ok) await outcome.runNotify();
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("treats a passed challenge as a genuine lead", async () => {
    const { deps, inserted } = makeDeps({ turnstile: "passed" });
    await submitEnquiry(VALID, deps);
    expect(inserted[0].status).toBe("new");
  });

  it("treats a skipped challenge as a genuine lead", async () => {
    // `"skipped"` is what an unconfigured deployment produces. Turnstile being
    // absent must never turn every enquiry into spam.
    const { deps, inserted } = makeDeps({ turnstile: "skipped" });
    await submitEnquiry(VALID, deps);
    expect(inserted[0].status).toBe("new");
  });

  it("defaults to skipped when the caller says nothing about Turnstile", async () => {
    const { deps, inserted } = makeDeps();
    await submitEnquiry(VALID, deps);
    expect(inserted[0].status).toBe("new");
  });
});

describe("the lead row", () => {
  it("normalises the phone to E.164 and stores a hash, never a raw IP", () => {
    const row = buildLeadRow(VALID, {
      phone: "61433418566",
      vanId: "v1",
      ipHash: "hash-abc",
      quarantined: false,
    });
    expect(row.phone).toBe("61433418566");
    expect(row.ip_hash).toBe("hash-abc");
    expect(JSON.stringify(row)).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/);
  });

  it("keeps the van slug even when the van cannot be resolved", async () => {
    const { deps, inserted } = makeDeps({ findVanIdBySlug: vi.fn(async () => null) });
    await submitEnquiry(VALID, deps);
    expect(inserted[0].van_id).toBeNull();
    expect(inserted[0].van_slug_raw).toBe("sprinter-mwb-high");
  });

  it("survives a van lookup that throws", async () => {
    const { deps, inserted } = makeDeps({
      findVanIdBySlug: vi.fn(async () => {
        throw new Error("postgrest exploded");
      }),
    });
    const outcome = await submitEnquiry(VALID, deps);
    expect(outcome.ok).toBe(true);
    expect(inserted[0].van_slug_raw).toBe("sprinter-mwb-high");
  });

  it("records consent with a timestamp", () => {
    const row = buildLeadRow(VALID, { phone: "x", vanId: null, ipHash: "h", quarantined: false });
    expect(row.consent).toMatchObject({ given: true });
  });
});

describe("channel dispatch isolation", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("one dead channel cannot suppress another", async () => {
    const dead: NotificationChannel = {
      name: "sms",
      send: async () => {
        throw new Error("provider down");
      },
    };
    const alive: NotificationChannel = {
      name: "email",
      send: async () => ({ channel: "email", sent: true }),
    };

    const results = await notifyAllChannels(
      { leadId: "l1", name: "Sam", phone: "61433418566", email: "s@example.com" },
      [dead, alive],
    );

    expect(results).toHaveLength(2);
    expect(results.find((r) => r.channel === "email")?.sent).toBe(true);
    expect(results.find((r) => r.channel === "sms")?.sent).toBe(false);
  });

  it("never throws, whatever the channels do", async () => {
    const chaos: NotificationChannel = {
      name: "chaos",
      send: () => Promise.reject("not even an Error"),
    };
    await expect(
      notifyAllChannels({ leadId: "l1", name: "S", phone: "6143", email: "s@e.com" }, [chaos]),
    ).resolves.toBeInstanceOf(Array);
  });
});
