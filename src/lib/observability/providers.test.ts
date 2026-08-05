import { describe, it, expect, afterEach } from "vitest";
import {
  API_PROVIDERS,
  PLANNED_PROVIDERS,
  TRACKED_PROVIDER_CODES,
  estimateCost,
  getProvider,
  isProviderConfigured,
  quotaUsedPct,
} from "./providers";

/**
 * The dashboard presents these figures as money, so the arithmetic and the
 * honesty rules around it need to hold — particularly the distinction between
 * "free" and "not billed per call", which are very different things to show an
 * admin deciding whether to keep using a service.
 */

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("registry integrity", () => {
  it("has unique provider codes across live and planned", () => {
    const codes = [...API_PROVIDERS, ...PLANNED_PROVIDERS].map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("exposes only the providers this app actually instruments", () => {
    // Phase 1 removed Typesense and the geocoder; Phase 4b removed Sentry
    // (never configured); Phase 5 removed Turnstile — §9 wants no CAPTCHA.
    expect([...TRACKED_PROVIDER_CODES].sort()).toEqual(["ses"]);
  });

  it("gives every provider a console link and a call site, so a spike is diagnosable", () => {
    for (const p of [...API_PROVIDERS, ...PLANNED_PROVIDERS]) {
      expect(p.consoleUrl).toMatch(/^https:\/\//);
      expect(p.callSite.length).toBeGreaterThan(0);
      expect(p.pricingCheckedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("does not claim to track a provider it cannot count", () => {
    // Sentry's SDK reports directly from client and server, bypassing our code;
    // Supabase is deliberately uninstrumented to keep listing pages fast.
    expect(getProvider("supabase")?.tracked).toBe(false);
    expect(getProvider("supabase")?.tracked).toBe(false);
  });
});

describe("estimateCost", () => {
  it("returns null for services that are not billed per call", () => {
    // Typesense bills per node-hour: showing $0.00 would imply it is free.
    expect(estimateCost(getProvider("supabase")!, 100_000)).toBeNull();
  });

  it("returns 0 for genuinely free services", () => {
    // No live provider is free any more (Turnstile was the last, removed in
    // Phase 5). The distinction still matters, so it is asserted directly.
    const free = { ...getProvider("ses")!, audPer1000: 0, monthlyQuota: null };
    expect(estimateCost(free, 500_000)).toBe(0);
  });

  it("prices metered usage per 1,000 units", () => {
    const ses = getProvider("ses")!;
    expect(estimateCost(ses, 10_000)).toBeCloseTo((10_000 / 1000) * ses.audPer1000!, 6);
  });

  it("charges only usage beyond a free quota", () => {
    const quotaProvider = { ...getProvider("ses")!, monthlyQuota: 1_000, audPer1000: 10 };
    expect(estimateCost(quotaProvider, 500)).toBe(0);
    expect(estimateCost(quotaProvider, 1_500)).toBeCloseTo(5, 6);
  });
});

describe("quotaUsedPct", () => {
  it("is null when the provider has no quota to breach", () => {
    expect(quotaUsedPct(getProvider("supabase")!, 5_000)).toBeNull();
  });

  it("caps at 100 so the progress bar cannot overflow", () => {
    // No live provider carries a monthly quota any more, so the arithmetic is
    // asserted against a synthetic one rather than a vendor's current plan —
    // which would make this test fail whenever a vendor changed pricing.
    const withQuota = { ...getProvider("ses")!, monthlyQuota: 1_000 };
    expect(quotaUsedPct(withQuota, 3_000)).toBe(100);
  });

  it("computes the proportion consumed", () => {
    const withQuota = { ...getProvider("ses")!, monthlyQuota: 1_000 };
    expect(quotaUsedPct(withQuota, 250)).toBe(25);
  });
});

describe("isProviderConfigured", () => {
  it("is true for a service that needs no credentials", () => {
    const noCreds = { ...getProvider("ses")!, configuredBy: [] as string[] };
    expect(isProviderConfigured(noCreds)).toBe(true);
  });

  it("requires every declared env var, not just one", () => {
    const supabase = getProvider("supabase")!;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(isProviderConfigured(supabase)).toBe(false);
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(isProviderConfigured(supabase)).toBe(true);
  });

  it("treats a blank value as unset", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "   ";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key";
    expect(isProviderConfigured(getProvider("supabase")!)).toBe(false);
  });
});
