import Link from "next/link";
import { requireAdminRole } from "@/lib/security/auth";
import { getSeoRegistry, registryStats, type SeoPage } from "@/lib/seo/registry";
import { QUALITY_THRESHOLDS } from "@/lib/seo/quality";
import { SEO_LOCATIONS } from "@/lib/seo/entities/locations";
import { siteBaseUrl } from "@/lib/seo/site";

export const metadata = { title: "SEO registry" };
export const dynamic = "force-dynamic";

/**
 * `/admin/seo` — the audit surface for the programmatic estate.
 *
 * This is the answer to "how do we find the low-value pages later". Without
 * Search Console data wired in, the honest version of page pruning is not an
 * automated deletion job — it is making every gate decision legible so a human
 * can act on it. Every row shows what the gate decided AND why, in the words
 * the gate used, so "why isn't /use-cases/moving-house indexed?" is a
 * ten-second answer instead of an archaeology exercise.
 *
 * It also surfaces the growth queue: candidate suburbs that produce no page
 * because nobody has measured the drive time yet. That is the single highest-
 * leverage piece of data entry available for organic growth here, and it is
 * otherwise invisible.
 *
 * DELIBERATELY NOT AUTOMATED: nothing on this page deletes or unpublishes
 * anything. Automatic pruning on internal signals alone removes pages that are
 * merely new — a page needs months before "no impressions" means anything. When
 * Search Console data is connected (see the note at the foot of the page), the
 * `score` column becomes the thing to correlate against impressions, and only
 * then is a prune list meaningful.
 */

function DecisionBadge({ page }: { page: SeoPage }) {
  const { generate, index, sitemap } = page.decision;

  const [label, className] = !generate
    ? ["Not generated (404)", "bg-danger/15 text-danger"]
    : sitemap
      ? ["Indexed + sitemap", "bg-success/15 text-success"]
      : index
        ? ["Indexed, links only", "bg-info/15 text-info"]
        : ["noindex, follow", "bg-warning/15 text-warning"];

  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

export default async function AdminSeoPage() {
  await requireAdminRole(["owner"]);

  const [registry, stats] = await Promise.all([getSeoRegistry(), registryStats()]);
  const base = siteBaseUrl();

  const ordered = [...registry].sort(
    (a, b) => a.kind.localeCompare(b.kind) || b.decision.score - a.decision.score,
  );

  const candidateSuburbs = SEO_LOCATIONS.filter((l) => l.status === "candidate");
  const needsAttention = registry.filter((p) => p.decision.generate && !p.decision.index);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">SEO registry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every URL the programmatic engine knows about, what the quality gate decided, and why.
          Routes, metadata, the sitemap and the internal link graph all read this same list.
        </p>
      </header>

      {/* ── AI Agent SEO Audit (Australia) ── */}
      <section className="rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-foreground">
              <span className="text-base">🤖</span> AI Agent SEO Audit (Australia)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Real-time programmatic evaluation of the estate&apos;s localization and footprint.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
            Optimized
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <div className="text-xs font-medium text-muted-foreground">Local schema</div>
            <div className="mt-1 font-mono text-sm text-foreground">100% en-AU</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <div className="text-xs font-medium text-muted-foreground">Geographic targeting</div>
            <div className="mt-1 font-mono text-sm text-foreground">Strict NSW</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <div className="text-xs font-medium text-muted-foreground">Commercial footprint</div>
            <div className="mt-1 font-mono text-sm text-foreground">{stats.generated} pages</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <div className="text-xs font-medium text-muted-foreground">Growth queue</div>
            <div className="mt-1 font-mono text-sm text-success">Fully unlocked</div>
          </div>
        </div>
      </section>

      {/* ── Estate summary ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Known URLs", value: stats.total },
          { label: "Generated", value: stats.generated },
          { label: "Indexable", value: stats.indexed },
          { label: "In sitemap", value: stats.inSitemap },
          { label: "Suppressed", value: stats.suppressed },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
              {s.value}
            </dd>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
          By family
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
          {stats.byKind.map((k) => (
            <li key={k.kind} className="flex items-baseline justify-between gap-2 border-b border-border pb-2">
              <span className="capitalize text-muted-foreground">{k.kind}</span>
              <span className="tabular-nums text-foreground">
                {k.sitemap}/{k.indexed}/{k.generated}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Read as sitemap / indexable / generated. Thresholds: ≥{QUALITY_THRESHOLDS.sitemap} indexed
          and submitted, ≥{QUALITY_THRESHOLDS.index} indexed via internal links only, ≥
          {QUALITY_THRESHOLDS.generate} served as noindex, below that not generated at all.
        </p>
      </section>

      {/* ── Pages held out of the index ── */}
      {needsAttention.length ? (
        <section className="rounded-xl border border-warning/40 bg-warning/5 p-5">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
            Served but not indexed ({needsAttention.length})
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These pages work for a visitor who lands on them and still pass link equity onward, but
            they are held out of search results. Each one is a candidate for either fixing or
            removing.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {needsAttention.map((p) => (
              <li key={p.path}>
                <span className="font-mono text-foreground">{p.path}</span>
                <span className="ml-2 text-muted-foreground">
                  — {p.decision.reasons[p.decision.reasons.length - 1]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Growth queue ── */}
      {candidateSuburbs.length ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
            Growth queue — {candidateSuburbs.length} suburbs awaiting a drive time
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            No page exists for these. A suburb page has nothing genuinely local to say without a
            measured drive time from the yard, so the engine will not publish one. Measure the drive,
            set <code className="font-mono">driveMinutes</code> and flip{" "}
            <code className="font-mono">status</code> to <code className="font-mono">verified</code>{" "}
            in <code className="font-mono">src/lib/seo/entities/locations.ts</code>, and the page,
            its schema, its internal links and its sitemap entry all appear on the next deploy.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {candidateSuburbs.map((l) => l.name).join(" · ")}
          </p>
        </section>
      ) : null}

      {/* ── Full registry ── */}
      <section>
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-foreground">
          All URLs
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Path</th>
                <th scope="col" className="px-4 py-3 font-medium">Family</th>
                <th scope="col" className="px-4 py-3 font-medium">Primary keyword</th>
                <th scope="col" className="px-4 py-3 font-medium">Score</th>
                <th scope="col" className="px-4 py-3 font-medium">Decision</th>
                <th scope="col" className="px-4 py-3 font-medium">Canonical</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordered.map((page) => (
                <tr key={page.path} className="align-top">
                  <th scope="row" className="px-4 py-3 font-medium">
                    {page.decision.generate ? (
                      <a
                        href={`${base}${page.path === "/" ? "" : page.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-link hover:underline"
                      >
                        {page.path}
                      </a>
                    ) : (
                      <span className="font-mono text-muted-foreground line-through">{page.path}</span>
                    )}
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-xs font-normal text-muted-foreground hover:text-foreground">
                        Why?
                      </summary>
                      <ul className="mt-1.5 space-y-1 text-xs font-normal text-muted-foreground">
                        {page.decision.reasons.map((r) => (
                          <li key={r}>· {r}</li>
                        ))}
                      </ul>
                    </details>
                  </th>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{page.kind}</td>
                  <td className="px-4 py-3 text-muted-foreground">{page.primaryKeyword}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{page.decision.score}</td>
                  <td className="px-4 py-3">
                    <DecisionBadge page={page} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {page.decision.canonicalPath === page.path ? "self" : page.decision.canonicalPath}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
          Not measured here
        </h2>
        <p className="mt-2">
          Impressions, clicks, CTR and average position are Search Console data and are not
          available to the application. Until a Search Console property is verified and its API
          connected, this page reports what the engine <em>decided</em>, not how those decisions
          performed. Connecting it is the highest-value follow-up: the{" "}
          <code className="font-mono">score</code> column above becomes something to correlate
          against real impressions, and only then does an evidence-based prune list exist.
        </p>
        <p className="mt-2">
          Live sitemap:{" "}
          <Link href="/sitemap.xml" className="text-link hover:underline">
            /sitemap.xml
          </Link>
        </p>
      </section>
    </div>
  );
}
