import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Phone, MessageCircle, Search } from "lucide-react";
import { getLeadList, getLeadStatusCounts } from "@/lib/data/leads";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_STYLES,
  LEAD_STATUS_ORDER,
  telHref,
  waHref,
  formatPhoneDisplay,
  type LeadStatus,
} from "@/lib/lead";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  ...LEAD_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] })),
  { value: "spam", label: "Spam" },
];

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const active = status ?? "all";

  const [leads, counts] = await Promise.all([
    getLeadList({
      status: active !== "all" ? (active as LeadStatus) : undefined,
      q: q || undefined,
    }),
    getLeadStatusCounts(),
  ]);

  const href = (tab: string) => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/admin/leads?${s}` : "/admin/leads";
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-sm text-muted-foreground">
          {counts.new ? `${counts.new} waiting for first contact.` : "Nothing waiting for first contact."}
        </p>
      </header>

      <form method="GET" action="/admin/leads" className="flex gap-2">
        {active !== "all" ? <input type="hidden" name="status" value={active} /> : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name, phone or email"
            aria-label="Search leads"
            className="h-11 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = t.value === "all" ? undefined : counts[t.value];
          return (
            <Link
              key={t.value}
              href={href(t.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                active === t.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-body hover:bg-muted"
              }`}
            >
              {t.label}
              {n ? <span className="ml-1.5 tabular-nums opacity-70">{n}</span> : null}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          {q
            ? `No leads match “${q}”.`
            : active !== "all"
              ? `No ${LEAD_STATUS_LABELS[active as LeadStatus]?.toLowerCase() ?? active} leads.`
              : "No leads yet."}
        </div>
      ) : (
        <>
          {/*
            Two renderings of the same data. Staff work this on a phone in a
            yard (CLAUDE.md §7), so under `md` each lead is a card with 44px
            call and WhatsApp targets rather than a table row that needs
            horizontal scrolling and a pinch to hit a link.
          */}
          <ul className="space-y-3 md:hidden">
            {leads.map((l) => (
              <li key={l.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="font-semibold text-foreground hover:text-link"
                    >
                      {l.name}
                    </Link>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {l.vanName ?? l.vanSlugRaw ?? "No van specified"}
                      {l.duration ? ` · ${l.duration}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${LEAD_STATUS_STYLES[l.status]}`}
                  >
                    {LEAD_STATUS_LABELS[l.status]}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                </p>

                <div className="mt-3 flex gap-2">
                  <a
                    href={telHref(l.phone)}
                    className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
                  >
                    <Phone className="size-4" /> Call
                  </a>
                  <a
                    href={waHref(l.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Received</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Van</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Contact</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="whitespace-nowrap p-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/leads/${l.id}`}
                        className="font-medium text-foreground hover:text-link"
                      >
                        {l.name}
                      </Link>
                      {l.suburb ? (
                        <span className="block text-xs text-muted-foreground">{l.suburb}</span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap p-3 tabular-nums text-body">
                      {formatPhoneDisplay(l.phone)}
                    </td>
                    <td className="p-3 text-body">{l.vanName ?? l.vanSlugRaw ?? "—"}</td>
                    <td className="p-3 text-body">{l.duration ?? "—"}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LEAD_STATUS_STYLES[l.status]}`}
                      >
                        {LEAD_STATUS_LABELS[l.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={telHref(l.phone)}
                          aria-label={`Call ${l.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
                        >
                          <Phone className="size-4" />
                        </a>
                        <a
                          href={waHref(l.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`WhatsApp ${l.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
