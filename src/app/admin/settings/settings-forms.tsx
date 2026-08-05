"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  saveCompanyProfile,
  savePhoneNumbers,
  saveNotificationRecipients,
  saveOpeningHours,
} from "./actions";

const input = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground";
type V = Record<string, unknown>;
type Action = (
  state: { ok?: boolean; error?: string } | undefined,
  fd: FormData,
) => Promise<{ ok?: boolean; error?: string }>;

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action: Action;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.ok) toast.success(`${title} saved`);
    else if (state?.error) toast.error(state.error);
  }, [state, title]);

  return (
    <form
      action={formAction}
      className="flex h-full flex-col space-y-3 rounded-xl border border-border bg-card p-5"
    >
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex-1 space-y-3">{children}</div>
      <div className="pt-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function L({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export function SettingsForms({
  company,
  phones,
  recipients,
  openingHours,
}: {
  company: V;
  phones: V;
  recipients: string[];
  openingHours: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card
        title="Business details"
        description="These render on every public page and in the site's structured data."
        action={saveCompanyProfile}
      >
        <div className="grid grid-cols-2 gap-3">
          <L label="Trading name">
            <input
              name="tradingName"
              defaultValue={String(company.trading_name ?? "")}
              className={input}
            />
          </L>
          <L label="Legal name">
            <input name="legalName" defaultValue={String(company.legal_name ?? "")} className={input} />
          </L>
          <L label="ABN">
            <input name="abn" defaultValue={String(company.abn ?? "")} className={input} />
          </L>
          <L label="Email">
            <input
              name="email"
              type="email"
              defaultValue={String(company.email ?? "")}
              className={input}
            />
          </L>
        </div>
        <L
          label="Address"
          hint="Must match the Google Business Profile exactly, character for character."
        >
          <input
            name="address"
            defaultValue={String(company.address ?? "")}
            placeholder="16 Ilma Street, Condell Park NSW 2200"
            className={input}
          />
        </L>
        <div className="grid grid-cols-2 gap-3">
          <L label="Latitude">
            <input name="latitude" defaultValue={String(company.latitude ?? "")} className={input} />
          </L>
          <L label="Longitude">
            <input name="longitude" defaultValue={String(company.longitude ?? "")} className={input} />
          </L>
        </div>
      </Card>

      <Card
        title="Opening hours"
        description="Leave a day blank if it is not confirmed — blank means unknown, not closed."
        action={saveOpeningHours}
      >
        <div className="grid grid-cols-2 gap-3">
          {DAYS.map((d) => (
            <L key={d.key} label={d.label}>
              <input
                name={d.key}
                defaultValue={openingHours[d.key] ?? ""}
                placeholder="7:00-17:00 or closed"
                className={input}
              />
            </L>
          ))}
        </div>
      </Card>

      <Card
        title="Phone and WhatsApp"
        description="Used by the call and WhatsApp buttons across the site."
        action={savePhoneNumbers}
      >
        <L label="Phone (as displayed)" hint="e.g. 0433 418 566">
          <input name="primary" defaultValue={String(phones.primary ?? "")} className={input} />
        </L>
        <L label="WhatsApp number" hint="Digits only, country code first — e.g. 61433418566">
          <input name="whatsapp" defaultValue={String(phones.whatsapp ?? "")} className={input} />
        </L>
      </Card>

      <Card
        title="Lead notifications"
        description="Where new enquiries are emailed."
        action={saveNotificationRecipients}
      >
        <L label="Recipient emails" hint="One per line.">
          <textarea
            name="emails"
            rows={4}
            defaultValue={recipients.join("\n")}
            className={input}
            placeholder="you@example.com"
          />
        </L>
      </Card>
    </div>
  );
}
