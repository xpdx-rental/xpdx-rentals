import { optionalEnv } from "@/lib/config";

/**
 * Cloudflare Turnstile server-side verification.
 *
 * ── The hole this closes ────────────────────────────────────────────────────
 * The enquiry form renders a `<Turnstile>` widget and posts the resulting token
 * as `token` in the JSON body. Nothing ever looked at it:
 *
 *   • `enquirySchema` has no `token` field, and Zod objects strip unknown keys,
 *     so the token was discarded during parsing.
 *   • `/api/v1/enquiries` never referenced it.
 *
 * The widget was therefore pure decoration — it loaded a third-party script on
 * every page carrying the form, made real users solve a challenge, and stopped
 * exactly zero bots, because a bot simply omits the field. A challenge that is
 * not verified server-side is worse than no challenge: it costs conversions and
 * buys nothing.
 *
 * ── Failure policy ──────────────────────────────────────────────────────────
 * CLAUDE.md §4 is absolute: "a lead must never be lost to a client-side error,
 * a failed third-party call, or a validation edge case." So this returns a
 * *verdict*, and the caller folds it into the existing spam signals — a
 * suspicious enquiry is quarantined (stored, flagged, invisible to staff
 * notifications) exactly like a honeypot hit, never rejected.
 *
 * Three states, and the distinction matters:
 *   "skipped" — no secret configured. Do nothing. This is today's behaviour and
 *               keeps local/dev/preview working without Cloudflare.
 *   "passed"  — verified, or Cloudflare itself failed us. **Fails open**: if
 *               siteverify is down or times out, quarantining every genuine
 *               enquiry in Australia because a Cloudflare endpoint is unhealthy
 *               is a far worse outcome than letting some spam through.
 *   "failed"  — Cloudflare gave us a definitive negative. Only this quarantines.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Short by design. This call sits in the request path of the one interaction
 * that earns this business money, so it gets a hard ceiling — beyond it we
 * stop waiting and let the enquiry through.
 */
const VERIFY_TIMEOUT_MS = 2500;

export type TurnstileVerdict = "skipped" | "passed" | "failed";

export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileVerdict> {
  const secret = optionalEnv("TURNSTILE_SECRET");
  if (!secret) return "skipped";

  // Configured but no token supplied: a real browser that rendered the widget
  // always sends one, so this is either a direct API post or a scripted client.
  if (!token || token.trim() === "") return "failed";

  const body = new URLSearchParams({ secret, response: token });
  // Cloudflare uses this to catch a token being replayed from a different
  // network. Never send our placeholder "0.0.0.0" — it would look like a
  // mismatch on every request behind a proxy that strips the header.
  if (remoteIp && remoteIp !== "0.0.0.0" && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      cache: "no-store",
    });

    // A 5xx from Cloudflare is Cloudflare's problem, not the customer's.
    if (!response.ok) return "passed";

    const result = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (result.success === true) return "passed";

    // `internal-error` is Cloudflare telling us it could not decide. Treat it
    // the same as an outage rather than as a negative verdict.
    if (result["error-codes"]?.includes("internal-error")) return "passed";

    return "failed";
  } catch {
    // Timeout, DNS failure, network partition — fail open.
    return "passed";
  }
}
