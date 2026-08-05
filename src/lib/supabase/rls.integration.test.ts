/**
 * RLS integration tests — CLAUDE.md §6 ("That test is not optional") and the
 * two §12 done-criteria:
 *
 *   • "Anonymous Supabase client cannot read `leads`. Test proves it."
 *   • "Anonymous client cannot read a `draft` van. Test proves it."
 *
 * These run against a REAL Supabase instance, because that is the only thing
 * that proves anything: RLS is enforced by Postgres, so a mocked client would
 * test the mock. They need migration 0019 applied and these env vars set:
 *
 *   SUPABASE_TEST_URL              project URL
 *   SUPABASE_TEST_ANON_KEY         anon / publishable key (the untrusted one)
 *   SUPABASE_TEST_SERVICE_ROLE_KEY service role key (to plant fixtures)
 *
 *   npx vitest run src/lib/supabase/rls.integration.test.ts
 *
 * Excluded from the default `npm run test` run (see vitest.config.ts) so the
 * unit suite stays hermetic and offline. When the env vars are absent the
 * suite fails loudly rather than skipping quietly — a green tick that proved
 * nothing is worse than a red one, and §12 asks for evidence.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_TEST_URL;
const ANON = process.env.SUPABASE_TEST_ANON_KEY;
const SERVICE = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

const DRAFT_SLUG = "rls-test-draft-van";
const LIVE_SLUG = "rls-test-available-van";

let anon: SupabaseClient;
let admin: SupabaseClient;
let draftVanId: string;
let leadId: string;

describe("RLS: the anonymous client", () => {
  beforeAll(async () => {
    if (!URL || !ANON || !SERVICE) {
      throw new Error(
        "RLS integration tests require SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY " +
          "and SUPABASE_TEST_SERVICE_ROLE_KEY. These tests are the only proof that " +
          "leads and draft vans are not publicly readable — see CLAUDE.md §12. " +
          "Do not treat an unrun suite as a pass.",
      );
    }

    anon = createClient(URL, ANON, { auth: { persistSession: false } });
    admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

    // Fixtures planted with the service role, which bypasses RLS by design.
    const { data: draft, error: draftErr } = await admin
      .from("vans")
      .insert({
        slug: DRAFT_SLUG,
        name: "RLS Test Draft Van",
        body_type: "Sprinter",
        wheelbase_label: "MWB",
        roof: "high",
        tonnage: 2.5,
        price_weekly_from: 400,
        status: "draft",
      })
      .select("id")
      .single();
    if (draftErr) throw draftErr;
    draftVanId = draft.id;

    const { error: liveErr } = await admin.from("vans").insert({
      slug: LIVE_SLUG,
      name: "RLS Test Available Van",
      body_type: "HiAce",
      wheelbase_label: "LWB",
      roof: "standard",
      tonnage: 1.0,
      price_weekly_from: 300,
      status: "available",
    });
    if (liveErr) throw liveErr;

    const { data: lead, error: leadErr } = await admin
      .from("leads")
      .insert({
        name: "RLS Test Lead",
        phone: "+61400000000",
        email: "rls-test@example.com",
      })
      .select("id")
      .single();
    if (leadErr) throw leadErr;
    leadId = lead.id;
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.from("leads").delete().eq("id", leadId);
    await admin.from("vans").delete().in("slug", [DRAFT_SLUG, LIVE_SLUG]);
  });

  // ── leads: no public read, ever ───────────────────────────────────────────

  it("cannot read any row from leads", async () => {
    const { data, error } = await anon.from("leads").select("*");
    // RLS returns an empty set rather than an error — a misauthorised query is
    // invisible, not rejected. Both outcomes are acceptable; returning a row
    // is not.
    expect(data ?? []).toEqual([]);
    if (error) expect(error.code).not.toBe("PGRST116");
  });

  it("cannot read a specific lead by id", async () => {
    const { data } = await anon.from("leads").select("*").eq("id", leadId);
    expect(data ?? []).toEqual([]);
  });

  it("cannot count leads", async () => {
    const { count } = await anon.from("leads").select("*", { count: "exact", head: true });
    expect(count ?? 0).toBe(0);
  });

  it("cannot insert a lead directly (public writes go through the server route)", async () => {
    const { data, error } = await anon
      .from("leads")
      .insert({ name: "Direct Insert", phone: "+61400000001", email: "nope@example.com" })
      .select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("cannot read lead_events", async () => {
    const { data } = await anon.from("lead_events").select("*");
    expect(data ?? []).toEqual([]);
  });

  // ── vans: draft is staff-only, non-draft is public ────────────────────────

  it("cannot read a draft van", async () => {
    const { data } = await anon.from("vans").select("*").eq("slug", DRAFT_SLUG);
    expect(data ?? []).toEqual([]);
  });

  it("cannot read a draft van by id", async () => {
    const { data } = await anon.from("vans").select("*").eq("id", draftVanId);
    expect(data ?? []).toEqual([]);
  });

  it("does not see draft vans in an unfiltered select", async () => {
    const { data } = await anon.from("vans").select("slug, status");
    const slugs = (data ?? []).map((v) => v.slug);
    expect(slugs).not.toContain(DRAFT_SLUG);
    expect((data ?? []).every((v) => v.status !== "draft")).toBe(true);
  });

  it("CAN read a non-draft van (the policy is not simply blocking everything)", async () => {
    const { data, error } = await anon.from("vans").select("slug").eq("slug", LIVE_SLUG);
    expect(error).toBeNull();
    expect((data ?? []).map((v) => v.slug)).toContain(LIVE_SLUG);
  });

  it("cannot write to vans", async () => {
    const { error } = await anon
      .from("vans")
      .update({ price_weekly_from: 1 })
      .eq("slug", LIVE_SLUG)
      .select("id");
    // Either rejected outright, or silently matches zero rows.
    const { data: check } = await admin
      .from("vans")
      .select("price_weekly_from")
      .eq("slug", LIVE_SLUG)
      .single();
    expect(check?.price_weekly_from).toBe(300);
    if (!error) expect(check?.price_weekly_from).not.toBe(1);
  });
});
