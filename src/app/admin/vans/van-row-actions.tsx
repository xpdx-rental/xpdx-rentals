"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown } from "lucide-react";
import { setVanStatus, moveVan } from "./actions";
import { VAN_STATUSES, VAN_STATUS_LABELS, type VanStatus } from "@/lib/van";

/**
 * Inline controls on the fleet list: status toggle and reorder.
 *
 * Both apply immediately — with six vans, a save button between "mark this
 * unavailable" and it being true on the site is friction for no benefit.
 */
export function VanRowActions({
  id,
  status,
  isFirst,
  isLast,
}: {
  id: string;
  status: VanStatus;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else {
        toast.success(success);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <label className="sr-only" htmlFor={`status-${id}`}>
        Availability
      </label>
      <select
        id={`status-${id}`}
        value={status}
        disabled={pending}
        onChange={(e) => run(() => setVanStatus(id, e.target.value as VanStatus), "Availability updated")}
        className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground disabled:opacity-50"
      >
        {VAN_STATUSES.map((s) => (
          <option key={s} value={s}>
            {VAN_STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-label="Move up"
        disabled={pending || isFirst}
        onClick={() => run(() => moveVan(id, "up"), "Reordered")}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-30"
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={pending || isLast}
        onClick={() => run(() => moveVan(id, "down"), "Reordered")}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-30"
      >
        <ArrowDown className="size-4" />
      </button>
    </div>
  );
}
