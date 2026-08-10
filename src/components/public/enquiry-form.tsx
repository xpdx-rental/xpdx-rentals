"use client";

import { useState, useRef, useId, useEffect } from "react";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { DURATIONS } from "@/lib/enquiry-options";
import { telHref } from "@/lib/lead";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

/**
 * Read once at module scope. `NEXT_PUBLIC_*` values are inlined at build time,
 * so this is a constant — but reading it in one place makes it obvious that an
 * unset key means "no widget at all", not "widget with a placeholder key".
 */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Enquiry form — the site's only conversion action.
 *
 * Phase 4 builds the form and its states; Phase 5 hardens the pipeline behind
 * it (§9: validate → insert → respond → notify, with the notification failure
 * never surfacing to the customer).
 *
 * Two deliberate choices from §9:
 *   • Success resolves in place. There is no redirect to a thank-you page,
 *     which would lose the context the customer was reading.
 *   • Failure copy states what happened and gives the phone number. Never a
 *     bare "something went wrong" — this form is how the business earns money,
 *     and a dead end costs a real customer.
 *
 * The honeypot is a real input positioned off-screen rather than
 * `display:none`, because some bots skip hidden fields. It is
 * `aria-hidden` and `tabIndex={-1}` so it is invisible to assistive tech and
 * to keyboard users.
 */
export function EnquiryForm({
  vanSlug,
  vanName,
  phone,
  compact = false,
}: {
  vanSlug?: string;
  vanName?: string;
  phone?: string | null;
  compact?: boolean;
}) {
  const formId = useId();
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  /**
   * Turnstile tokens are single-use — Cloudflare redeems one exactly once at
   * siteverify. If the server answers with an inline error the form stays
   * mounted holding the token it already spent, so a retry would post it again
   * and siteverify would answer `timeout-or-duplicate`. That reads as a
   * definitive negative, which quarantines the lead (see spam-check.ts) — the
   * customer would be silently filed as spam purely for pressing the button
   * twice. So every path that leaves the form retryable discards the spent
   * token and asks the widget for a fresh one.
   */
  function resetChallenge() {
    setToken("");
    turnstileRef.current?.reset();
  }
  // Set in an effect, not during render: `Date.now()` is impure and calling it
  // in the render body is a React purity violation. Measuring from when the
  // form actually became interactive is also the more honest timing baseline
  // for the anti-spam check.
  const renderedAt = useRef<number | null>(null);
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const utm: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
        const v = params.get(k);
        if (v) utm[k] = v;
      }
    }

    const payload = {
      name: fd.get("name"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      suburb: fd.get("suburb") || undefined,
      vanSlug: fd.get("vanSlug") || undefined,
      duration: fd.get("duration") || undefined,
      startDate: fd.get("startDate") || undefined,
      message: fd.get("message") || undefined,
      consent: fd.get("consent") === "on",
      website: fd.get("website") || "",
      // Coerced to a string: `fd.get` returns null when the widget is not
      // rendered, and a null would fail schema validation and 400 the whole
      // enquiry over an optional anti-spam field.
      token: (fd.get("cf-turnstile-response") as string | null) ?? "",
      formRenderedAt: renderedAt.current ?? undefined,
      meta: {
        pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        device:
          typeof navigator === "undefined"
            ? "unknown"
            : /iPad|Tablet/i.test(navigator.userAgent)
              ? "tablet"
              : /Mobi|Android|iPhone/i.test(navigator.userAgent)
                ? "mobile"
                : "desktop",
        utm,
      },
    };

    try {
      const res = await fetch("/api/v1/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);

      if (res.ok) {
        setStatus("sent");
        // Conversion event for GTM (§9). Guarded so a missing dataLayer never
        // breaks the success state.
        if (typeof window !== "undefined") {
          (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({
            event: "enquiry_submitted",
            van: vanSlug ?? null,
          });
        }
        return;
      }

      if (json?.error?.fields) setFieldErrors(json.error.fields);
      setStatus("error");
      setError(
        json?.error?.message ??
          "We could not send your enquiry just now. Please call us and we'll take the details over the phone.",
      );
      resetChallenge();
    } catch {
      setStatus("error");
      setError(
        "Your enquiry did not reach us — you may be offline. Please try again, or call us and we'll take the details over the phone.",
      );
      resetChallenge();
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-success/40 bg-success/5 p-6" role="status">
        <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
        <h3 className="mt-3 font-heading text-xl font-bold text-foreground">
          Thanks — we’ve got your enquiry.
        </h3>
        <p className="mt-2 text-body">
          Someone from our team will be in touch shortly
          {vanName ? ` about the ${vanName}` : ""}. If it’s urgent, give us a call.
        </p>
        {phone ? (
          <a
            href={telHref(phone)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
          >
            <Phone className="size-4" aria-hidden="true" /> {phone}
          </a>
        ) : null}
      </div>
    );
  }

  const inputCls =
    "mt-1 min-h-12 w-full rounded-xl border border-border bg-background shadow-inner px-4 text-base text-foreground placeholder:text-muted-foreground transition-all duration-300 hover:bg-accent/50 hover:border-primary/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/20 focus-visible:outline-none";
  const err = (f: string) => fieldErrors[f];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {vanSlug ? <input type="hidden" name="vanSlug" value={vanSlug} /> : null}

      {/* Honeypot: off-screen, not display:none. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${formId}-website`}>Do not fill this in</label>
        <input id={`${formId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={compact ? "space-y-4" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Your name</span>
          <input name="name" required autoComplete="name" className={inputCls} />
          {err("name") ? <span className="mt-1 block text-xs text-danger">{err("name")}</span> : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Phone</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="0400 000 000"
            className={inputCls}
          />
          {err("phone") ? <span className="mt-1 block text-xs text-danger">{err("phone")}</span> : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            className={inputCls}
          />
          {err("email") ? <span className="mt-1 block text-xs text-danger">{err("email")}</span> : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">
            Suburb <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <input name="suburb" autoComplete="address-level2" className={inputCls} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">How long do you need it?</span>
          <select name="duration" defaultValue="" className={inputCls}>
            <option value="">Select…</option>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted-foreground">28 day minimum hire.</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">
            Preferred start <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <input name="startDate" type="date" className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-foreground">
          Anything else? <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <textarea
          name="message"
          rows={4}
          className="mt-1 w-full rounded-xl border border-border bg-background shadow-inner px-4 py-3 text-base text-foreground placeholder:text-muted-foreground transition-all duration-300 hover:bg-accent/50 hover:border-primary/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/20 focus-visible:outline-none resize-y"
          placeholder="What you'll be carrying, or anything we should know."
        />
      </label>

      <label className="flex items-start gap-3">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-1 size-5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <span className="text-sm text-body">
          I agree to XPDX Rentals contacting me about this enquiry.
        </span>
      </label>
      {err("consent") ? <p className="text-xs text-danger">{err("consent")}</p> : null}

      {status === "error" && error ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
          {phone ? (
            <>
              {" "}
              <a href={telHref(phone)} className="font-semibold underline">
                {phone}
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      {/*
        Turnstile.

        Two deliberate changes from the previous version, both of which were
        costing leads:

        1. **The widget only renders when a site key is actually configured.**
           It used to fall back to `1x00000000000000000000AA` — Cloudflare's
           *always-passes test key*. That loaded a third-party script on every
           page carrying this form in every environment, and it produced tokens
           that mean nothing. Worse, now that the server genuinely verifies
           (lib/security/turnstile.ts), a test-key token against a real secret
           would be rejected and quarantine every enquiry.

        2. **A missing token no longer disables the submit button.** It did
           before, so any visitor whose challenge failed to load — an
           ad-blocker, a corporate proxy, a locked-down browser, a Cloudflare
           outage — was left with a permanently greyed-out button and no
           explanation. That is a silently lost customer, and CLAUDE.md §4 does
           not allow it. The form always submits; the server decides what the
           token was worth, and a bad one quarantines the lead rather than
           refusing it.
      */}
      {TURNSTILE_SITE_KEY ? (
        <div className="pt-2">
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            // Lands on the widget's container div. `options.action` below is
            // what Cloudflare actually receives; this mirrors it onto the
            // markup so the integration is greppable from the rendered DOM.
            data-action="turnstile-spin-v2"
            onSuccess={setToken}
            // Clear the stale token on expiry/error so we never post a token
            // that Cloudflare will reject when an empty one is treated the same
            // way and is honest about what happened.
            onExpire={() => setToken("")}
            onError={() => setToken("")}
            options={{
              theme: "light",
              size: "flexible",
              // Rendered onto the widget's own container as
              // `data-action="turnstile-spin-v2"`. Account-level analytics
              // attribution only — the integration works without it.
              action: "turnstile-spin-v2",
            }}
          />
          <input type="hidden" name="cf-turnstile-response" value={token} />
        </div>
      ) : null}

      <div className="pt-2">
        <MagneticButton
          type="submit"
          disabled={status === "submitting"}
          className="group relative inline-flex min-h-14 w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 font-bold text-primary-foreground text-[15px] tracking-tight shadow-[0_8px_32px_rgba(201, 171, 129,0.35)] transition-shadow hover:shadow-[0_12px_48px_rgba(201, 171, 129,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="absolute inset-0 [transform:skew(-20deg)_translateX(-120%)] group-hover:[transform:skew(-20deg)_translateX(200%)] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="relative flex items-center gap-2">
            {status === "submitting" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {status === "submitting" ? "Sending…" : "Get a quote"}
          </span>
        </MagneticButton>
      </div>

      {/*
        Risk-reversal, right where the commitment-anxiety is highest. Every
        clause here is already true elsewhere in the product (no deposit is
        taken on submit, no card field exists on this form, and support
        response time is stated site-wide as "usually same business day" —
        kept un-absolute here for the same reason).
      */}
      <p className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" /> No obligation
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" /> No credit card required
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" /> Usually same-day response
        </span>
      </p>
    </form>
  );
}
