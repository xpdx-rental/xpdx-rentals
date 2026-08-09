"use client";

import { ErrorState } from "@/components/error-state";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Admin Panel Error"
      message={error.message || "We couldn't load the data for this page. Please try again."}
      onRetry={reset}
    />
  );
}
