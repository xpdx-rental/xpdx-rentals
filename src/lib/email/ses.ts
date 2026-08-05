import nodemailer from "nodemailer";
import { getAppUrl, optionalEnv } from "@/lib/config";
import { recordApiCall } from "@/lib/observability/usage";

/**
 * Transactional email over SMTP (AWS SES). No-ops when SMTP env is unset.
 *
 * Phase 1 (strip) cut this module from eleven exports to three. The removed
 * templates all came from earlier products and had no reachable
 * caller: vendor-approval, vehicle-approval, marketing broadcast, buyer↔staff
 * message notification, the contact-form relay, the WhatsApp lead alert, and
 * the two lead templates superseded by `lib/leads/channels.ts`. They carried
 * links to routes that no longer exist, plus the previous owner's sender
 * identity (REBRAND.md §3.2 — their domain is deliberately not repeated here,
 * because comments end up in shipped sourcemaps).
 *
 * Sender identity, branding and the logo asset are set in Phase 7.
 */

const smtpHost = optionalEnv("SMTP_HOST");
const smtpPort = parseInt(optionalEnv("SMTP_PORT") || "465", 10);
const smtpUser = optionalEnv("SMTP_USER");
const smtpPass = optionalEnv("SMTP_PASS");

const baseTransporter = (smtpHost && smtpUser && smtpPass)
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

/**
 * SMTP transport, wrapped once so every send in this module is counted for
 * usage metrics without touching the individual send functions.
 *
 * The wrapper only observes: it records the outcome and duration, then returns
 * or re-throws exactly what nodemailer produced. Metrics never alter delivery,
 * and `recordApiCall` swallows its own errors, so a metrics failure can never
 * stop an enquiry alert reaching the team.
 */
export const transporter = baseTransporter
  ? new Proxy(baseTransporter, {
      get(target, prop, receiver) {
        if (prop !== "sendMail") return Reflect.get(target, prop, receiver);
        return async (...args: Parameters<typeof target.sendMail>) => {
          const startedAt = Date.now();
          try {
            const info = await target.sendMail(...args);
            recordApiCall("ses", { ok: true, durationMs: Date.now() - startedAt });
            return info;
          } catch (error) {
            recordApiCall("ses", { ok: false, durationMs: Date.now() - startedAt });
            throw error;
          }
        };
      },
    })
  : null;

// Sender identity comes from env only — no hardcoded fallback domain.
// TODO(client): confirm the XPDX sending identity, then set EMAIL_FROM /
// REPLY_TO_EMAIL. SPF, DKIM and DMARC must be in place before launch or lead
// notifications land in spam (REBRAND.md §7).
const FROM = optionalEnv("EMAIL_FROM") ?? "";
const REPLY_TO = optionalEnv("REPLY_TO_EMAIL") ?? optionalEnv("CONTACT_EMAIL_TO") ?? "";

// ─── Welcome email (staff account creation, via auth callback) ───────────────

export async function sendWelcomeEmail(input: { to: string; name: string }) {
  if (!transporter || !FROM) return { skipped: true };
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO || undefined,
    to: input.to,
    subject: "Your account is ready",
    text: [
      `Hi ${input.name || "there"},`,
      "",
      "Your account has been created.",
      "",
      `${getAppUrl()}/admin`,
    ].join("\n"),
  });
  return { skipped: false };
}

// ─── Staff reminder (cron) ──────────────────────────────────────────────────

export async function sendUnreadLeadReminderEmail(input: {
  to: string;
  unreadCount: number;
}) {
  if (!transporter || !FROM) return { skipped: true };
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO || undefined,
    to: input.to,
    subject: `${input.unreadCount} unread enquiry(s)`,
    text: [
      `There are ${input.unreadCount} enquiries waiting for a response.`,
      "",
      `${getAppUrl()}/admin/leads`,
    ].join("\n"),
  });
  return { skipped: false };
}
