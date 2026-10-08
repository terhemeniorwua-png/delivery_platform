"use client";

import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import {
  availabilityLabel,
  availabilityTone,
  vehicleLabel,
} from "@/lib/delivery";
import { formatDateTime } from "@/lib/orders";

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value || "—"}</span>
    </div>
  );
}

export default function RiderProfile() {
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
        title="Unable to load your profile"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  if (!rider) return <CenteredSpinner label="Loading your profile" />;

  const user = rider.user ?? {};

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-semibold text-primary">
          {(user.firstName?.[0] ?? "R").toUpperCase()}
          {(user.lastName?.[0] ?? "").toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
            {user.firstName} {user.lastName}
          </h1>
          <p className="mt-0.5 truncate text-sm text-muted">{user.email}</p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Account</h2>
          <Badge tone={user.status === "ACTIVE" ? "success" : "warning"}>{user.status}</Badge>
        </div>
        <div className="mt-2 divide-y divide-border">
          <Row label="Full name" value={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()} />
          <Row label="Email address" value={user.email} />
          <Row label="Phone" value={user.phone} />
          <Row label="Role" value={user.role} />
          <Row label="Joined" value={formatDateTime(user.createdAt || rider.createdAt)} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Rider details</h2>
          <Badge tone={availabilityTone(rider.availability)}>
            {availabilityLabel(rider.availability)}
          </Badge>
        </div>
        <div className="mt-2 divide-y divide-border">
          <Row label="Vehicle type" value={vehicleLabel(rider.vehicleType)} />
          <Row label="Vehicle number" value={rider.vehicleNumber} />
          <Row label="Rider ID" value={rider.id} />
        </div>
        <p className="mt-4 text-xs text-muted">
          To change your vehicle details, contact an administrator.
        </p>
      </section>
    </div>
  );
}