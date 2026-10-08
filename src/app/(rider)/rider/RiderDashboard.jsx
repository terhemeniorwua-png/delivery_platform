"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import StatCard from "@/components/dashboard/StatCard";
import AvailabilityControl from "@/components/rider/AvailabilityControl";
import {
  deliveryStatusLabel,
  deliveryStatusTone,
  RIDER_ACTIONS,
  availabilityLabel,
} from "@/lib/delivery";
import { formatDateTime } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function RiderDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get("/riders/me/dashboard"), api.get("/deliveries", { query: { limit: 6 } })])
      .then(([dashboard, list]) => {
        if (cancelled) return;
        setData(dashboard);
        setDeliveries(list.deliveries ?? []);
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
        title="Unable to load your dashboard"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  if (!data) return <CenteredSpinner label="Loading your dashboard" />;

  const stats = data.stats;
  const active = data.activeDelivery;
  const availability = data.rider?.availability;
  const nextAction = active ? RIDER_ACTIONS[active.status] : null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              {greeting()}, {user?.firstName ?? "rider"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              You are currently{" "}
              <span className="font-medium text-ink">{availabilityLabel(availability)}</span>.
            </p>
          </div>
          <Badge tone={availability === "AVAILABLE" ? "success" : availability === "BUSY" ? "warning" : "neutral"}>
            {availabilityLabel(availability)}
          </Badge>
        </div>
      </section>

      <AvailabilityControl
        rider={data.rider}
        onUpdated={(rider) => setData((prev) => ({ ...prev, rider: { ...prev.rider, ...rider } }))}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active deliveries" value={stats.active} tone="primary" />
        <StatCard label="Delivered" value={stats.delivered} tone="success" />
        <StatCard label="Cancelled" value={stats.cancelled} tone="danger" />
        <StatCard label="Total assigned" value={stats.total} tone="neutral" />
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Active delivery</h2>
        {active ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary-soft p-4">
            <div>
              <p className="text-sm font-semibold text-ink">{active.order?.orderNumber ?? "Delivery"}</p>
              <p className="mt-0.5 text-xs text-muted">
                {active.order?.totalAmount != null ? formatPrice(active.order.totalAmount) : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={deliveryStatusTone(active.status)}>{deliveryStatusLabel(active.status)}</Badge>
              <Link href={`/rider/deliveries/${active.id}`} className={buttonClassName("primary", "sm")}>
                {nextAction ? nextAction.label : "Open delivery"}
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState
            className="mt-3"
            title="No active delivery"
            description="New jobs will appear here once an administrator assigns one to you."
          />
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Recent deliveries</h2>
          <Link href="/rider/deliveries" className="text-sm font-medium text-primary hover:text-primary-hover">
            View all
          </Link>
        </div>
        {deliveries.length === 0 ? (
          <EmptyState className="mt-3" title="No deliveries yet" description="Assigned deliveries will show up here." />
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {deliveries.map((delivery) => (
              <li key={delivery.id}>
                <Link
                  href={`/rider/deliveries/${delivery.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 transition-colors hover:text-primary"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {delivery.order?.orderNumber ?? "Delivery"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDateTime(delivery.createdAt)}
                    </p>
                  </div>
                  <Badge tone={deliveryStatusTone(delivery.status)}>
                    {deliveryStatusLabel(delivery.status)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}