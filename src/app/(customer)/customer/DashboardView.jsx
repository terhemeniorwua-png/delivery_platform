"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel, orderStatusTone, formatDateTime } from "@/lib/orders";

/**
 * Customer overview — real data from GET /api/orders (own orders only;
 * the backend scopes every query to the JWT user).
 */
export default function DashboardView() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      api
        .get("/orders", { query: { page: 1, limit: 5 } })
        .then((result) => {
          setData(result);
          setError(null);
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-56 rounded-lg" />
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load your account overview"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );
  }

  const orders = data?.orders ?? [];
  const total = data?.pagination?.total ?? 0;
  const firstName = user?.firstName ?? "there";

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Hi {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Track your orders, manage your details and keep shopping.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Orders placed
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">{total}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Latest status
            </p>
            <div className="mt-2">
              {orders[0] ? (
                <Badge tone={orderStatusTone(orders[0].status)}>
                  {orderStatusLabel(orders[0].status)}
                </Badge>
              ) : (
                <span className="text-sm text-muted">No orders yet</span>
              )}
            </div>
          </div>
          <div className="flex items-end">
            <Link href="/shop" className={buttonClassName("secondary", "md", "w-full")}>
              Continue shopping
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="recent-orders">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-orders" className="text-base font-semibold text-ink">
            Recent orders
          </h2>
          {total > 0 ? (
            <Link
              href="/customer/orders"
              className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              View all
            </Link>
          ) : null}
        </div>

        {orders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
            <p className="text-sm font-semibold text-ink">No orders yet</p>
            <p className="mt-1 text-sm text-muted">
              When you place your first order it will show up here.
            </p>
            <div className="mt-5">
              <Link href="/shop" className={buttonClassName()}>
                Start shopping
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/customer/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-background"
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {order.orderNumber}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatDateTime(order.createdAt)} ·{" "}
                      {order.items?.length ?? 0} item
                      {(order.items?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-ink">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <Badge tone={orderStatusTone(order.status)}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
