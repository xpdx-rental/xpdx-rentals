import { createHash } from "crypto";
import { optionalEnv } from "@/lib/config";

/**
 * Layered anti-spam for public lead forms (SRS §9.20 / §20):
 * honeypot, minimum time-to-submit, and disposable-email soft flag.
 * Spam is quarantined silently (the client still sees success) so bots aren't
 * taught what tripped the filter.
 */

// Minimum plausible human fill time. Faster than this ⇒ almost certainly a bot.
const MIN_SUBMIT_MS = 2000;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "trashmail.com", "yopmail.com", "sharklasers.com", "getnada.com",
  "throwawaymail.com", "temp-mail.org", "fakeinbox.com", "maildrop.cc",
]);

export type SpamVerdict = { isSpam: boolean; reason: string | null };

export function checkSpam(input: {
  website?: string; // honeypot — must be empty
  formRenderedAt?: number;
  email?: string;
  /**
   * Result of the server-side Turnstile check (lib/security/turnstile.ts).
   * `"skipped"` when Turnstile is not configured, and `"passed"` also covers
   * the case where Cloudflare was unreachable — only a definitive `"failed"`
   * quarantines, so an outage at Cloudflare never costs a genuine enquiry.
   */
  turnstile?: "skipped" | "passed" | "failed";
}): SpamVerdict {
  // Turnstile said no. Checked first because it is the strongest signal we
  // have: it is the only one a bot cannot trivially satisfy by leaving a field
  // alone or waiting two seconds.
  if (input.turnstile === "failed") {
    return { isSpam: true, reason: "turnstile" };
  }
  // Honeypot filled ⇒ bot.
  if (input.website && input.website.trim().length > 0) {
    return { isSpam: true, reason: "honeypot" };
  }
  // Submitted implausibly fast ⇒ bot.
  if (typeof input.formRenderedAt === "number" && Number.isFinite(input.formRenderedAt)) {
    const elapsed = Date.now() - input.formRenderedAt;
    if (elapsed >= 0 && elapsed < MIN_SUBMIT_MS) {
      return { isSpam: true, reason: "too_fast" };
    }
  }
  // Disposable email ⇒ soft flag (still quarantine).
  if (input.email) {
    const domain = input.email.split("@")[1]?.toLowerCase().trim();
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      return { isSpam: true, reason: "disposable_email" };
    }
  }
  return { isSpam: false, reason: null };
}

/** Best-effort E.164 normalization (defaults to AU when no country code given). */
export function normalizePhone(raw: string, defaultCc = "61"): string {
  const s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("00")) return `+${s.slice(2)}`;
  if (s.startsWith("0")) return `+${defaultCc}${s.slice(1)}`;
  if (s.startsWith(defaultCc)) return `+${s}`;
  return `+${defaultCc}${s}`;
}

/** Salted, non-reversible hash of a client IP (never store raw IPs — SRS §20). */
export function hashIp(ip: string): string {
  const salt = optionalEnv("IP_HASH_SECRET") || "unsalted-dev";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Best-guess client IP.
 *
 * `cf-connecting-ip` comes first because this site sits behind Cloudflare (the
 * geo gate in `proxy.ts` reads `cf-ipcountry`, and the CSP allowlists
 * challenges.cloudflare.com). Cloudflare sets that header itself and strips any
 * inbound copy, which makes it the only one here a client cannot forge.
 * `x-forwarded-for` is client-appendable, so it is a fallback, not the primary
 * — and it was the primary in this function, while the near-identical helper in
 * `lib/security/rate-limit.ts` already preferred `cf-connecting-ip`. The two
 * disagreeing meant the enquiry endpoint and the CTA endpoint were rate-limited
 * on different notions of "who".
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}
