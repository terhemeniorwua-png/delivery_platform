"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/EmptyState";

/** Shop-specific error boundary: safe message + retry, no raw backend text. */
export default function ShopError({ error, reset }) {
  useEffect(() => {
    console.error("[shop-error]", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Shop</h1>
      <ErrorState
        title="Unable to load products"
        message="Please try again. If the problem persists, come back in a few minutes."
        onRetry={() => reset()}
      />
    </div>
  );
}
