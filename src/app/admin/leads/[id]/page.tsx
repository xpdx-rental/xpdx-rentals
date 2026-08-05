import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Phone, MessageCircle, Mail } from "lucide-react";
import { getLeadDetail } from "@/lib/data/leads";
import { LeadActions } from "../lead-actions";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_STYLES,
  telHref,
  waHref,
  formatPhoneDisplay,
} from "@/lib/lead";

export const metadata = { title: "Lead" };
export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  created: "Enquiry received",
  status_changed: "Status changed",
  note: "Note added",
  assigned: "Assigned",
  notified: "Team notified",
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getLeadDetail(id);
  if (!data) notFound();
  const { lead, events } = data;

  const utmEntries = Object.entries(lead.utm ?? {}).filter(([, v]) => v !== null && v !== "");
  const vanLabel = lead.vanName ?? lead.vanSlugRaw;

  // Pre-fills the WhatsApp message so staff do not retype context on a phone.
  const waMessage = vanLabel
    ? `Hi ${lead.name}, thanks for your enquiry with XPDX Rentals about the ${vanLabel}.`
    : `Hi ${lead.name}, thanks for your enquiry with XPDX Rentals.`;

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to leads
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{lead.name}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(lead.createdAt), "d MMM yyyy, h:mma")}
            {lead.suburb ? ` · ${lead.suburb}` : ""}
            {lead.source !== "website" ? ` · via ${lead.source}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${LEAD_STATUS_STYLES[lead.status]}`}
        >
          {LEAD_STATUS_LABELS[lead.status]}
        </span>
      </div>

      {/* One tap each. Minimum 44px targets — this is worked on a phone. */}
      <div className="flex flex-wrap gap-2">
        <a
          href={telHref(lead.phone)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Phone className="size-4" />
          {formatPhoneDisplay(lead.phone)}
        </a>
        <a
          href={waHref(lead.phone, waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-success px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
        <a
          href={`mailto:${lead.email}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Mail className="size-4" />
          {lead.email}
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Enquiry</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Van</dt>
                <dd className="text-foreground">{vanLabel ?? "Not specified"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Duration</dt>
                <dd className="text-foreground">{lead.duration ?? "Not specified"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Preferred start</dt>
                <dd className="text-foreground">
                  {lead.startDate ? format(new Date(lead.startDate), "d MMM yyyy") : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Suburb</dt>
                <dd className="text-foreground">{lead.suburb ?? "Not specified"}</dd>
              </div>
            </dl>
          </section>

          {lead.message ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Message</h2>
              <p className="whitespace-pre-line text-sm text-body">{lead.message}</p>
            </section>
          ) : null}

          {lead.staffNotes ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Latest staff note</h2>
              <p className="whitespace-pre-line text-sm text-body">{lead.staffNotes}</p>
            </section>
          ) : null}

          {lead.pagePath || lead.referrer || lead.device || utmEntries.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-5 text-sm">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Attribution</h2>
              <dl className="space-y-1">
                {lead.pagePath ? (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Page</dt>
                    <dd className="break-all text-body">{lead.pagePath}</dd>
                  </div>
                ) : null}
                {lead.referrer ? (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Referrer</dt>
                    <dd className="break-all text-body">{lead.referrer}</dd>
                  </div>
                ) : null}
                {lead.device ? (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Device</dt>
                    <dd className="capitalize text-body">{lead.device}</dd>
                  </div>
                ) : null}
                {utmEntries.map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="break-all text-body">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Timeline</h2>
            <ol className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 flex-none rounded-full bg-primary" />
                  <div>
                    <p className="text-foreground">
                      {EVENT_LABELS[e.event] ?? e.event}
                      {e.event === "status_changed" && e.data?.status
                        ? `: ${String(e.data.status)}`
                        : ""}
                    </p>
                    {e.event === "note" && e.data?.note ? (
                      <p className="whitespace-pre-line text-body">{String(e.data.note)}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.createdAt), "d MMM, h:mma")}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div>
          <LeadActions leadId={lead.id} status={lead.status} />
        </div>
      </div>
    </div>
  );
}
