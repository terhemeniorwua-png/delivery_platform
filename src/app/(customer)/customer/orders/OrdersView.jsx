"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import Pagination from "@/components/storefront/Pagination";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel, orderStatusTone, formatDateTime } from "@/lib/orders";

const PAGE_SIZE = 8;

/** Own-order list — GET /api/orders is scoped to the JWT user server-side. */
export default function OrdersView({ current = {} }) {
  const page = Number(current.page) > 0 ? Number(current.page) : 1;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/orders", { query: { page, limit: PAGE_SIZE } })
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
  }, [page, attempt]);

  function retry() {
    setError(null);
    setAttempt((value) => value + 1);
  }

  // Skeleton while the first page loads, and while a new page is in flight.
  const loading = (!data || data.forPage !== page) && !error;

  if (loading) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-border bg-surface"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Unable to load your orders" message={getApiErrorMessage(error)} onRetry={retry} />;
  }

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Your orders will appear here after you check out."
        action={
          <Link href="/shop" className={buttonClassName()}>
            Start shopping
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {pagination.total} order{pagination.total === 1 ? "" : "s"}
      </p>

      <ul className="space-y-3">
        {orders.map((order) => {
          const itemCount = order.items?.length ?? 0;
          return (
            <li key={order.id}>
              <Link
                href={`/customer/orders/${order.id}`}
                className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{order.orderNumber}</p>
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
                <p className="mt-2 truncate text-xs text-muted">
                  {[order.address?.city, order.address?.state, order.address?.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <Pagination
          basePath="/customer/orders"
          current={current}
          page={pagination.page}
          totalPages={pagination.totalPages}
        />
      </div>
    </div>
  );
}
