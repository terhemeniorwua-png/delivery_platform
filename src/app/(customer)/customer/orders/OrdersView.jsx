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
import { formatPrice } from "@/lib/format";
import {
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
  paymentMethodLabel,
  deliveryStatusLabel,
  deliveryStatusTone,
  formatDateTime,
} from "@/lib/orders";

const PAGE_SIZE = 8;

/** Filter pills — value maps to the backend `status` query param. */
const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "READY_FOR_PICKUP", label: "Ready" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

/** Own-order list — GET /api/orders is scoped to the JWT user server-side. */
export default function OrdersView({ current = {} }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const page = Number(current.page) > 0 ? Number(current.page) : 1;
  const status = STATUS_FILTERS.some((f) => f.value === current.status)
    ? current.status
    : "";
  const search = current.search ?? "";

  const [searchDraft, setSearchDraft] = useState(search);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Keep the input in sync when the URL changes (e.g. back/forward, clear).
  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/orders", { query: { page, limit: PAGE_SIZE, status, search } })
      .then((result) => {
        if (cancelled) return;
        setData({ ...result, forPage: page });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, search, attempt]);

  function navigate(changes) {
    startTransition(() => {
      router.replace(`/customer/orders${buildQuery(current, changes)}`, {
        scroll: false,
      });
    });
  }

  function retry() {
    setError(null);
    setAttempt((value) => value + 1);
  }

  function onSearchSubmit(event) {
    event.preventDefault();
    navigate({ search: searchDraft.trim(), page: "" });
  }

  const filtered = Boolean(status || search);
  // Skeleton while the first page loads, and while a new page is in flight.
  const loading = (!data || data.forPage !== page) && !error;

  return (
    <div>
      <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:max-w-xs sm:flex-1">
          <Input
            label="Search orders"
            type="search"
            name="search"
            placeholder="Order number"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            hint="Search by order number."
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className={buttonClassName("secondary", "md", "mb-0.5 sm:w-auto")}
        >
          Search
        </button>
        {search ? (
          <button
            type="button"
            onClick={() => navigate({ search: "", page: "" })}
            className="mb-0.5 inline-flex h-9 items-center px-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </form>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
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
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load your orders"
            message={getApiErrorMessage(error)}
            onRetry={retry}
          />
        ) : (data?.orders ?? []).length === 0 ? (
          <EmptyState
            title={filtered ? "No matching orders" : "No orders yet"}
            description={
              filtered
                ? "Try a different status or search term."
                : "Your orders will appear here after you check out."
            }
            action={
              filtered ? (
                <button
                  type="button"
                  onClick={() => navigate({ status: "", search: "", page: "" })}
                  className={buttonClassName()}
                >
                  Clear filters
                </button>
              ) : (
                <Link href="/shop" className={buttonClassName()}>
                  Start shopping
                </Link>
              )
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted" aria-live="polite">
              {data.pagination.total} order
              {data.pagination.total === 1 ? "" : "s"}
            </p>

            <ul className="space-y-3">
              {data.orders.map((order) => {
                const itemCount = order.items?.length ?? 0;
                const payment = order.payments?.[0];
                const delivery = order.deliveries?.[0];
                return (
                  <li key={order.id}>
                    <Link
                      href={`/customer/orders/${order.id}`}
                      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {order.orderNumber}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {formatDateTime(order.createdAt)} · {itemCount} item
                            {itemCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-ink">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <Badge tone={orderStatusTone(order.status)}>
                            {orderStatusLabel(order.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {payment ? (
                          <Badge tone={paymentStatusTone(payment.status)}>
                            {paymentMethodLabel(payment.method)} ·{" "}
                            {paymentStatusLabel(payment.status)}
                          </Badge>
                        ) : null}
                        {delivery ? (
                          <Badge tone={deliveryStatusTone(delivery.status)}>
                            {deliveryStatusLabel(delivery.status)}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted">
                          {[order.address?.city, order.address?.state, order.address?.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <span className="text-xs font-medium text-primary">
                          View order &rarr;
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8">
              <Pagination
                basePath="/customer/orders"
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