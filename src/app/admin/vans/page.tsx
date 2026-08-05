import Link from "next/link";
import Image from "next/image";
import { Plus, ImageOff, AlertTriangle } from "lucide-react";
import { getVanList } from "@/lib/data/vans";
import { VanRowActions } from "./van-row-actions";
import { VAN_STATUS_LABELS, VAN_STATUS_STYLES, formatWeekly } from "@/lib/van";

export const metadata = { title: "Fleet" };
export const dynamic = "force-dynamic";

/**
 * Fleet list — CLAUDE.md §7 screen 2.
 *
 * Ordered by the operator's own `sort_order`, with an inline availability
 * toggle, reorder controls, the primary image and the weekly rate. Vans whose
 * pricing or dimensions are unverified are badged, so unconfirmed data is
 * visible without opening anything.
 */
export default async function AdminVansPage() {
  const vans = await getVanList();
  const unverified = vans.filter((v) => !v.priceVerified || !v.dimensionsVerified).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Fleet</h1>
          <p className="text-sm text-muted-foreground">
            {vans.length} van{vans.length === 1 ? "" : "s"}
            {unverified ? ` · ${unverified} with unconfirmed data` : ""}
          </p>
        </div>
        <Link
          href="/admin/vans/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus className="size-4" /> Add van
        </Link>
      </header>

      {vans.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No vans yet.{" "}
          <Link href="/admin/vans/new" className="text-link hover:underline">
            Add the first one
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {vans.map((v, i) => (
            <li
              key={v.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {v.primaryImage ? (
                  <Image
                    src={v.primaryImage.url}
                    alt={v.primaryImage.alt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    <ImageOff className="size-5" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/vans/${v.id}`}
                    className="font-semibold text-foreground hover:text-link"
                  >
                    {v.name}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${VAN_STATUS_STYLES[v.status]}`}
                  >
                    {VAN_STATUS_LABELS[v.status]}
                  </span>
                </div>

                <p className="mt-0.5 text-sm text-body">
                  From <span className="tabular-nums">{formatWeekly(v.priceWeeklyFrom)}</span>/week
                  <span className="text-muted-foreground">
                    {" · "}
                    {v.imageCount} photo{v.imageCount === 1 ? "" : "s"}
                  </span>
                </p>

                {!v.priceVerified || !v.dimensionsVerified ? (
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <AlertTriangle className="size-3.5 text-warning" />
                    {!v.priceVerified ? (
                      <span className="rounded bg-warning/10 px-1.5 py-0.5 font-medium text-warning">
                        Price unverified
                      </span>
                    ) : null}
                    {!v.dimensionsVerified ? (
                      <span className="rounded bg-warning/10 px-1.5 py-0.5 font-medium text-warning">
                        Dimensions unverified
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>

              <VanRowActions
                id={v.id}
                status={v.status}
                isFirst={i === 0}
                isLast={i === vans.length - 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
