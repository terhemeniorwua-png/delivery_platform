"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Button, { buttonClassName } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/EmptyState";
import { ProductCardSkeletons } from "@/components/storefront/ProductGrid";
import { formatPrice } from "@/lib/format";
import {
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
} from "@/lib/orders";

/**
 * Order-confirmation screen. Shows the real order returned by
 * POST /api/orders (number, totals, address) and the payment state from
 * GET /api/orders/:id — if recording the payment method failed we say so
 * plainly instead of pretending the payment went through.
 */
export default function SuccessView({ orderId }) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!orderId) return;
    api
      .get(`/orders/${orderId}`)
      .then((data) => {
        setOrder(data.order);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    load();
  }, [authLoading, isAuthenticated, load]);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    router.replace("/login?next=%2Fcheckout%2Fsuccess");
  }, [authLoading, isAuthenticated, router]);

  // No ?order= param → straight to the error state (never resolves to a
  // permanent skeleton).
  if (authLoading || !isAuthenticated || (loading && orderId)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <ProductCardSkeletons count={2} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState
          title="Order not found"
          message={error ? getApiErrorMessage(error) : "This order does not exist."}
          onRetry={orderId ? load : undefined}
        />
        <div className="mt-6 text-center">
          <Link href="/customer/orders" className={buttonClassName("secondary")}>
            View your orders
          </Link>
        </div>
      </div>
    );
  }

  const payment = order.payments?.[0] ?? null;
  const itemCount = order.items?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-10">
        <span
          aria-hidden="true"
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-7 text-success"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Order confirmed
        </h1>
        <p className="mt-2 text-sm text-muted">
          Thank you for your purchase — we&apos;ll start preparing your clothing shortly.
        </p>

        <div className="mt-6 grid gap-4 rounded-xl border border-border bg-background p-5 text-left sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Order</p>
            <p className="mt-1 text-sm font-semibold text-ink">{order.orderNumber}</p>
            <div className="mt-1.5">
              <Badge tone={orderStatusTone(order.status)}>
                {orderStatusLabel(order.status)}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Total</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {formatPrice(order.totalAmount)}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Delivering to</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {order.address?.recipientName}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {[order.address?.city, order.address?.state].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>

        {/* Honest payment state — success, pending, or "not recorded". */}
        {payment ? (
          <p className="mt-5 text-sm text-muted">
            Payment method:{" "}
            <span className="font-medium text-ink">
              {payment.method === "CASH"
                ? "Cash on delivery"
                : payment.method === "CARD"
                  ? "Card"
                  : "Bank transfer"}
            </span>{" "}
            — {paymentStatusLabel(payment.status).toLowerCase()}.
          </p>
        ) : (
          <p
            role="status"
            className="mt-5 rounded-lg bg-warning-soft px-4 py-3 text-sm font-medium text-warning"
          >
            Your order is in, but we couldn&apos;t record your payment method. Our team will
            confirm payment with you shortly.
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/customer/orders/${order.id}`} className={buttonClassName("primary", "lg")}>
            View order
          </Link>
          <Link href="/shop" className={buttonClassName("secondary", "lg")}>
            Continue shopping
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={() => router.push("/")}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
