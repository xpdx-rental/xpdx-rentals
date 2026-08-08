import { describe, it, expect } from "vitest";
import { canonicalLowercasePath, isSafeRedirectPath, isAdminZone } from "@/lib/routing";

/**
 * The lowercase-canonicalisation rule had a bug that shipped precisely because
 * it was inline in `proxy.ts` and therefore untestable: the prefix check ran
 * against the raw path, so the mixed-case URLs it existed to fix skipped it
 * entirely. The first test below is that exact case.
 */
describe("canonicalLowercasePath", () => {
  it("redirects when the casing differs INSIDE the prefix", () => {
    // The regression. `/Van-Hire/Bankstown` does not startsWith("/van-hire/"),
    // so the previous implementation let it through to a 404.
    expect(canonicalLowercasePath("/Van-Hire/Bankstown")).toBe("/van-hire/bankstown");
  });

  it("redirects when the casing differs after the prefix", () => {
    expect(canonicalLowercasePath("/van-hire/Bankstown")).toBe("/van-hire/bankstown");
  });

  it("handles every programmatic family", () => {
    expect(canonicalLowercasePath("/Use-Cases/Courier-Delivery")).toBe("/use-cases/courier-delivery");
    expect(canonicalLowercasePath("/Vans/Toyota-HiAce-SLWB")).toBe("/vans/toyota-hiace-slwb");
  });

  it("does not redirect an already-canonical path", () => {
    expect(canonicalLowercasePath("/van-hire/bankstown")).toBeNull();
    expect(canonicalLowercasePath("/vans")).toBeNull();
  });

  it("leaves paths outside the programmatic families alone", () => {
    // Redirecting these is not this rule's job, and a blanket lowercase rule
    // at the edge would rewrite admin and API paths too.
    expect(canonicalLowercasePath("/About-Us")).toBeNull();
    expect(canonicalLowercasePath("/Admin/Leads")).toBeNull();
    expect(canonicalLowercasePath("/API/v1/enquiries")).toBeNull();
  });

  it("does not fire on the family hub itself, only its children", () => {
    // `/van-hire` is a static route; only the dynamic children need the rule,
    // and the trailing slash in the prefix is what keeps them apart.
    expect(canonicalLowercasePath("/Van-Hire")).toBeNull();
  });
});

describe("isSafeRedirectPath", () => {
  it("accepts same-origin relative paths", () => {
    expect(isSafeRedirectPath("/admin/leads")).toBe(true);
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(isSafeRedirectPath("//evil.example")).toBe(false);
    expect(isSafeRedirectPath("https://evil.example")).toBe(false);
    expect(isSafeRedirectPath("/\\evil.example")).toBe(false);
  });
});

describe("isAdminZone", () => {
  it("covers the admin panel but not its login page", () => {
    expect(isAdminZone("/admin")).toBe(true);
    expect(isAdminZone("/admin/leads")).toBe(true);
    expect(isAdminZone("/admin-login")).toBe(false);
    expect(isAdminZone("/van-hire/bankstown")).toBe(false);
  });
});
