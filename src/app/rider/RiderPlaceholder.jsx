"use client";

import { useAuth } from "@/context/AuthContext";
import RoleGate from "@/components/auth/RoleGate";

/**
 * Navigation compatibility placeholder for approved riders.
 *
 * The full Rider Dashboard is Phase 9 (out of scope here). Approval still
 * flips the account to RIDER, so RoleGate and "Go to Rider Dashboard"
 * links need a real destination instead of a 404. This page intentionally
 * contains no dashboard features.
 */
export default function RiderPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <RoleGate roles={["RIDER"]}>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-2xl">
          ✓
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          You&apos;re approved
        </h1>
        <p className="mt-2 text-sm text-muted">
          Welcome, {user?.firstName ?? "rider"}. Your account now has the rider role. The rider
          workspace is arriving in the next phase.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-background"
          >
            Log out
          </button>
        </div>
      </div>
    </RoleGate>
  );
}