"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import { buildQuery } from "@/lib/url";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import Pagination from "@/components/storefront/Pagination";
import { formatDateTime } from "@/lib/orders";
import { deliveryStatusLabel, deliveryStatusTone, DELIVERY_STATUSES } from "@/lib/delivery";

const PAGE_SIZE = 8;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "PICKED_UP", label: "Picked up" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

/** Own deliveries — GET /api/deliveries is scoped to the JWT rider server-side. */
export default function RiderDeliveries({ current = {} }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const page = Number(current.page) > 0 ? Number(current.page) : 1;
  const status = DELIVERY_STATUSES.includes(current.status) ? current.status : "";

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const requestKey = `${page}|${status}`;

  useEffect(() => {
    let cancelled = false;
    api
      .get("/deliveries", { query: { page, limit: PAGE_SIZE, status } })
      .then((result) => {
        if (cancelled) return;
        setData({ ...result, forKey: requestKey });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, requestKey, attempt]);

  function navigate(changes) {
    startTransition(() => {
      router.replace(`/rider/deliveries${buildQuery(current, changes)}`, { scroll: false });
    });
  }

  const filtered = Boolean(status);
  const loading = (!data || data.forKey !== requestKey) && !error;

  if (error) {
    return (
      <ErrorState
        title="Unable to load your deliveries"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by delivery status">
        {STATUS_FILTERS.map((filter) => {
          const active = filter.value === status;
          return (
            <button
              key={filter.value || "all"}
              type="button"
              disabled={isPending}
              aria-pressed={active}
              onClick={() => navigate({ status: filter.value, page: "" })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-muted hover:border-primary/40 hover:text-ink"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl border border-border bg-surface" />
            ))}
          </div>
        ) : (data?.deliveries ?? []).length === 0 ? (
          <EmptyState
            title={filtered ? "No matching deliveries" : "No deliveries yet"}
            description={
              filtered
                ? "Try a different status."
                : "Deliveries assigned to you will appear here."
            }
            action={
              filtered ? (
                <button
                  type="button"
                  onClick={() => navigate({ status: "", page: "" })}
                  className={buttonClassName()}
                >
                  Show all deliveries
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted" aria-live="polite">
              {data.pagination.total} delivery{data.pagination.total === 1 ? "" : "ies"}
            </p>

            <ul className="space-y-3">
              {data.deliveries.map((delivery) => (
                <li key={delivery.id}>
                  <Link
                    href={`/rider/deliveries/${delivery.id}`}
                    className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {delivery.order?.orderNumber ?? "Delivery"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{formatDateTime(delivery.createdAt)}</p>
                      </div>
                      <Badge tone={deliveryStatusTone(delivery.status)}>
                        {deliveryStatusLabel(delivery.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="truncate text-xs text-muted">
                        {[delivery.order?.address?.city, delivery.order?.address?.state]
                          .filter(Boolean)
                          .join(", ") || "Address on file"}
                      </p>
                      <span className="text-xs font-medium text-primary">Open delivery &rarr;</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Pagination
                basePath="/rider/deliveries"
                current={current}
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}