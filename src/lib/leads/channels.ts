/**
 * Lead notification channels.
 *
 * CLAUDE.md §9: "Notify on new lead: email to the address in settings, and a
 * WhatsApp or SMS hook if the client wants it later — put it behind a clean
 * interface so adding a channel is one adapter, not a rewrite."
 *
 * The contract every channel must honour:
 *
 *   1. **Never throw.** A channel returns a result; it does not raise. The lead
 *      is already durable by the time any of this runs, and an exception here
 *      must not be able to reach the request.
 *   2. **Never block another channel.** Channels are dispatched together and
 *      settled independently, so a dead SMS provider cannot suppress the email.
 *   3. **Report honestly.** `sent: false` with a reason, so the lead timeline
 *      records what actually happened rather than assuming success.
 *
 * Adding SMS or WhatsApp is a new object in `CHANNELS` and nothing else.
 */

import { transporter } from "@/lib/email/ses";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionalEnv } from "@/lib/config";

export type EnquiryNotification = {
  leadId: string;
  name: string;
  phone: string;
  email: string;
  suburb?: string | null;
  vanSlug?: string | null;
  duration?: string | null;
  message?: string | null;
  pagePath?: string | null;
};

export type ChannelResult = {
  channel: string;
  sent: boolean;
  /** Why not, when `sent` is false. Recorded, never surfaced to the customer. */
  reason?: string;
};

export type NotificationChannel = {
  name: string;
  /** Must never throw. Must never take longer than it needs to. */
  send(input: EnquiryNotification): Promise<ChannelResult>;
};

async function notificationRecipients(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "notification_recipients")
      .maybeSingle();
    const emails = (data?.value as { emails?: string[] } | null)?.emails;
    const list = Array.isArray(emails) ? emails.filter(Boolean) : [];
    const fallback = optionalEnv("CONTACT_EMAIL_TO");
    return list.length > 0 ? list : fallback ? [fallback] : [];
  } catch {
    return [];
  }
}

function summarise(input: EnquiryNotification): { subject: string; text: string } {
  const subject = input.vanSlug
    ? `New enquiry: ${input.vanSlug} — ${input.name}`
    : `New enquiry from ${input.name}`;

  const text = [
    "New enquiry from the website.",
    "",
    `Name:     ${input.name}`,
    `Phone:    ${input.phone}`,
    `Email:    ${input.email}`,
    input.suburb ? `Suburb:   ${input.suburb}` : null,
    input.vanSlug ? `Van:      ${input.vanSlug}` : null,
    input.duration ? `Duration: ${input.duration}` : null,
    input.message ? `\nMessage:\n${input.message}` : null,
    input.pagePath ? `\nPage: ${input.pagePath}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text };
}

export const emailChannel: NotificationChannel = {
  name: "email",
  async send(input) {
    try {
      const from = optionalEnv("EMAIL_FROM");
      if (!transporter || !from) {
        return { channel: "email", sent: false, reason: "smtp_not_configured" };
      }
      const to = await notificationRecipients();
      if (to.length === 0) {
        return { channel: "email", sent: false, reason: "no_recipients" };
      }
      const { subject, text } = summarise(input);
      await transporter.sendMail({
        from,
        replyTo: optionalEnv("REPLY_TO_EMAIL") ?? optionalEnv("CONTACT_EMAIL_TO") ?? undefined,
        to,
        subject,
        text,
      });
      return { channel: "email", sent: true };
    } catch (err) {
      return {
        channel: "email",
        sent: false,
        reason: err instanceof Error ? err.message.slice(0, 200) : "unknown_error",
      };
    }
  },
};

/**
 * Active channels. Add an adapter here to add a channel — nothing in the
 * enquiry route changes.
 *
 * TODO(client): SMS or WhatsApp on new lead, if wanted. §9 anticipates it.
 */
export const CHANNELS: NotificationChannel[] = [emailChannel];

/**
 * Dispatch to every channel, settling independently.
 *
 * `allSettled`, not `all`: one channel rejecting must not cancel the others.
 * The outer try/catch is belt and braces — an adapter is contractually
 * forbidden from throwing, but a lead is too valuable to rely on that.
 */
export async function notifyAllChannels(
  input: EnquiryNotification,
  channels: NotificationChannel[] = CHANNELS,
): Promise<ChannelResult[]> {
  try {
    const settled = await Promise.allSettled(channels.map((c) => c.send(input)));
    return settled.map((s, i) =>
      s.status === "fulfilled"
        ? s.value
        : {
            channel: channels[i]?.name ?? "unknown",
            sent: false,
            reason:
              s.reason instanceof Error ? s.reason.message.slice(0, 200) : "channel_threw",
          },
    );
  } catch {
    return channels.map((c) => ({ channel: c.name, sent: false, reason: "dispatch_failed" }));
  }
}
