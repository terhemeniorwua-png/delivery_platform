"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import {
  orderStatusLabel,
  orderStatusTone,
  formatDateTime,
} from "@/lib/orders";

const TERMINAL = ["DELIVERED", "CANCELLED"];

const RIDER_CARD = {
  none: {
    title: "Become a delivery rider",
    body: "Earn by delivering orders in your area. Apply in a few minutes.",
    cta: "Apply to ride",
  },
  PENDING: {
    title: "Rider application under review",
    body: "We've received your application. An admin will review it soon.",
    cta: "View application",
  },
  APPROVED: {
    title: "You're approved as a rider",
    body: "Your account is being upgraded to a rider. Head to your rider dashboard.",
    cta: "Rider dashboard",
  },
  REJECTED: {
    title: "Rider application not approved",
    body: "You can review the reason and apply again.",
    cta: "Review & reapply",
  },
};

/** Overview: greeting, active order, rider application, and recent orders. */
export default function DashboardView() {
  const [orders, setOrders] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [ordersError, setOrdersError] = useState(null);
  const [application, setApplication] = useState(undefined);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/orders", { query: { page: 1, limit: 5 } })
      .then((data) => {
        if (cancelled) return;
        setOrders(data.orders ?? []);
        setPagination(data.pagination);
        setOrdersError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setOrdersError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/rider-applications/me")
      .then((data) => {
        if (cancelled) return;
        setApplication(data.application ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setApplication(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = orders === null && !ordersError;
  const total = pagination?.total ?? 0;
  const activeOrder = (orders ?? []).find((order) => !TERMINAL.includes(order.status));
  const riderState = application?.status ?? "none";
  const riderCard = RIDER_CARD[riderState] ?? RIDER_CARD.none;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              My account
            </h1>
            <p className="mt-1 text-sm text-muted">
              Track orders, manage your profile, and apply to ride.
            </p>
          </div>
          <Link href="/shop" className={buttonClassName("secondary")}>
            Continue shopping
          </Link>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Orders</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink">{total}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Active</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink">
              {(orders ?? []).filter((order) => !TERMINAL.includes(order.status)).length}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Rider status
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">
              {riderState === "none" ? "Not applied" : riderState.replace("_", " ").toLowerCase()}
            </dd>
          </div>
        </dl>
      </section>

      {activeOrder ? (
        <section
          aria-labelledby="active-order"
          className="rounded-xl border border-primary/30 bg-primary-soft p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Active order
              </p>
              <p id="active-order" className="mt-1 text-sm font-semibold text-ink">
                {activeOrder.orderNumber} · {formatPrice(activeOrder.totalAmount)}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Placed {formatDateTime(activeOrder.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={orderStatusTone(activeOrder.status)}>
                {orderStatusLabel(activeOrder.status)}
              </Badge>
              <Link
                href={`/customer/orders/${activeOrder.id}`}
                className={buttonClassName("secondary", "sm")}
              >
                Track order
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
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

          {loading ? (
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
              {[0, 1, 2].map((index) => (
                <li key={index} className="h-[74px] animate-pulse" aria-hidden="true" />
              ))}
            </ul>
          ) : ordersError ? (
            <div className="mt-4 rounded-xl border border-error/30 bg-error-soft px-6 py-8 text-center">
              <p className="text-sm font-medium text-error">
                {getApiErrorMessage(ordersError)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setOrdersError(null);
                  setOrders([]);
                  setAttempt((value) => value + 1);
                }}
                className="mt-3 text-sm font-medium text-primary hover:text-primary-hover"
              >
                Try again
              </button>
            </div>
          ) : (orders ?? []).length === 0 ? (
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
                        {formatDateTime(order.createdAt)} · {order.items?.length ?? 0} item
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

        <section
          aria-labelledby="rider-card"
          className="rounded-xl border border-border bg-surface p-5"
        >
          <h2 id="rider-card" className="text-base font-semibold text-ink">
            {riderCard.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{riderCard.body}</p>
          {riderState === "REJECTED" && application?.rejectionReason ? (
            <p className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted">
              Reason: {application.rejectionReason}
            </p>
          ) : null}
          <div className="mt-4">
            <Link
              href={
                riderState === "APPROVED" ? "/rider" : "/customer/become-rider"
              }
              className={buttonClassName(riderState === "none" ? "primary" : "secondary")}
            >
              {riderCard.cta}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}