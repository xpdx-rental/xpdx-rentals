"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setVanStatus } from "../actions";
import { VAN_STATUSES, VAN_STATUS_LABELS, type VanStatus } from "@/lib/van";

export function VanStatusToggle({ id, status }: { id: string; status: VanStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as VanStatus;
    startTransition(async () => {
      const res = await setVanStatus(id, newStatus);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Availability updated");
        router.refresh();
      }
    });
  }

  return (
    <select
      value={status}
      disabled={pending}
      onChange={onChange}
      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
    >
      {VAN_STATUSES.map((s) => (
        <option key={s} value={s}>
          {VAN_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
