"use client";

import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import AvailabilityControl from "@/components/rider/AvailabilityControl";

export default function RiderAvailability() {
  const [rider, setRider] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/riders/me/profile")
      .then((result) => {
        if (cancelled) return;
        setRider(result.rider);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <ErrorState
        title="Unable to load your availability"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  if (!rider) return <CenteredSpinner label="Loading availability" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Availability</h1>
        <p className="mt-1 text-sm text-muted">
          Go online to receive new delivery jobs, or go offline when you are off shift.
        </p>
      </div>

      <AvailabilityControl rider={rider} onUpdated={setRider} />

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">What the statuses mean</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            <span className="font-medium text-ink">Available</span> — you can receive new delivery
            jobs.
          </li>
          <li>
            <span className="font-medium text-ink">Busy</span> — you have active delivery work; set
            automatically and cannot be toggled manually.
          </li>
          <li>
            <span className="font-medium text-ink">Offline</span> — you are not accepting delivery
            work. Blocked while you still have active deliveries.
          </li>
        </ul>
      </div>
    </div>
  );
}