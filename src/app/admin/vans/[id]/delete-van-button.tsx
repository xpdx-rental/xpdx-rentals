"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import { deleteVan } from "../actions";

/** Two-step delete: destructive and not undoable, so it needs a deliberate second press. */
export function DeleteVanButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  function onClick() {
    if (!confirming) {
      setConfirming(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }
    startTransition(async () => {
      const res = await deleteVan(id);
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`min-h-11 rounded-lg border px-4 text-sm font-medium transition-colors disabled:opacity-50 ${
        confirming
          ? "border-danger bg-danger font-bold text-white hover:bg-danger/90"
          : "border-danger/40 text-danger hover:bg-danger/10"
      }`}
    >
      {confirming ? "Click again to delete permanently" : "Delete van"}
    </button>
  );
}
