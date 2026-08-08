import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstile } from "@/lib/security/turnstile";

/**
 * The contract that matters here is not "does it call Cloudflare" — it is
 * **which failures are allowed to cost a lead**.
 *
 * CLAUDE.md §4: "a lead must never be lost to a client-side error, a failed
 * third-party call, or a validation edge case." So every way Cloudflare can let
 * us down has to resolve to `"passed"`, and only a definitive negative verdict
 * may resolve to `"failed"`.
 */

const originalSecret = process.env.TURNSTILE_SECRET_KEY;

function mockFetch(impl: () => Promise<Response> | never) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
  else process.env.TURNSTILE_SECRET_KEY = originalSecret;
});

describe("verifyTurnstile", () => {
  it("skips entirely when no secret is configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect(await verifyTurnstile("anything")).toBe("skipped");
    // Local, preview and any deployment without Turnstile must not make a
    // network call on the conversion path.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes a token Cloudflare accepts", async () => {
    mockFetch(async () => jsonResponse({ success: true }));
    expect(await verifyTurnstile("good-token")).toBe("passed");
  });

  it("fails a token Cloudflare rejects", async () => {
    mockFetch(async () => jsonResponse({ success: false, "error-codes": ["invalid-input-response"] }));
    expect(await verifyTurnstile("forged-token")).toBe("failed");
  });

  it("fails when configured but no token was supplied", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    // A browser that rendered the widget always posts a token, so an empty one
    // means a direct API post or a scripted client.
    expect(await verifyTurnstile("")).toBe("failed");
    expect(await verifyTurnstile(undefined)).toBe("failed");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // ── Everything below is a Cloudflare-side failure: all must fail OPEN ──────

  it("passes when siteverify returns a server error", async () => {
    mockFetch(async () => jsonResponse({}, 503));
    expect(await verifyTurnstile("token")).toBe("passed");
  });

  it("passes when Cloudflare reports its own internal error", async () => {
    mockFetch(async () => jsonResponse({ success: false, "error-codes": ["internal-error"] }));
    expect(await verifyTurnstile("token")).toBe("passed");
  });

  it("passes when the request throws (timeout, DNS, offline)", async () => {
    mockFetch(async () => {
      throw new Error("network down");
    });
    expect(await verifyTurnstile("token")).toBe("passed");
  });

  it("passes when the response is not valid JSON", async () => {
    mockFetch(async () => new Response("<html>gateway timeout</html>", { status: 200 }));
    expect(await verifyTurnstile("token")).toBe("passed");
  });

  it("sends the remote IP but never the placeholder addresses", async () => {
    const bodies: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        bodies.push(String(init.body));
        return jsonResponse({ success: true });
      }),
    );

    await verifyTurnstile("token", "203.0.113.9");
    await verifyTurnstile("token", "0.0.0.0");
    await verifyTurnstile("token", "unknown");

    expect(bodies[0]).toContain("remoteip=203.0.113.9");
    // `clientIp` falls back to these when no proxy header is present; sending
    // them would look like a mismatch to Cloudflare on every such request.
    expect(bodies[1]).not.toContain("remoteip");
    expect(bodies[2]).not.toContain("remoteip");
  });
});
