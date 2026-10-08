"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/EmptyState";

/**
 * Root error boundary. Shows a safe generic message + retry —
 * backend stack traces are never rendered (matches the API client policy).
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <ErrorState
        title="Something went wrong"
        message="An unexpected error occurred. Please try again."
        onRetry={() => reset()}
      />
    </div>
  );
}
