"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button, { buttonClassName } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/EmptyState";
import OrderTimeline from "@/components/customer/OrderTimeline";
import { ProductCardSkeletons } from "@/components/storefront/ProductGrid";
import { primaryImage } from "@/lib/catalog";
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

const CANCELABLE = ["PENDING", "CONFIRMED"];

function ItemThumb({ productId }) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!productId) return undefined;
    api
      .get(`/products/${productId}`)
      .then((product) => {
        if (cancelled) return;
        setImage(primaryImage(product));
      })
      .catch(() => {
        /* product may be inactive — fall back to a placeholder */
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <span className="relative block size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-background to-primary-soft">
      {image ? (
        <Image
          src={image.imageUrl}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : null}
    </span>
  );
}

/**
 * Single order (GET /api/orders/:id — backend rejects other customers'
 * IDs with 404). Timeline, delivery info, "buy again", and cancel via a
 * confirmation modal (POST /api/orders/:id/cancel).
 */
export default function OrderDetailView({ orderId }) {
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [buyingId, setBuyingId] = useState(null);

  const load = useCallback(
    () =>
      api
        .get(`/orders/${orderId}`)
        .then((data) => {
          setOrder(data.order);
          setError(null);
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false)),
    [orderId]
  );

  useEffect(() => {
    load();
  }, [load]);

  function cancelOrder() {
    if (cancelling) return;
    setCancelling(true);
    api
      .post(`/orders/${orderId}/cancel`, {})
      .then((data) => {
        setOrder(data.order);
        toast("Order cancelled", { type: "success" });
        setCancelOpen(false);
      })
      .catch((err) => toast(getApiErrorMessage(err), { type: "error" }))
      .finally(() => setCancelling(false));
  }

  function buyAgain(item) {
    if (buyingId) return;
    setBuyingId(item.id);
    api
      .post("/cart/items", { productVariantId: item.productVariantId, quantity: 1 })
      .then(() => {
        window.dispatchEvent(new Event("cart:updated"));
        toast("Added to your cart", { type: "success" });
      })
      .catch((err) => toast(getApiErrorMessage(err), { type: "error" }))
      .finally(() => setBuyingId(null));
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
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
          onRetry={load}
        />
        <div className="mt-6 text-center">
          <Link href="/customer/orders" className={buttonClassName("secondary")}>
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = CANCELABLE.includes(order.status);
  const payments = order.payments ?? [];
  const delivery = order.deliveries?.[0] ?? null;
  const rider = delivery?.rider ?? null;
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/customer/orders"
            className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            &larr; All orders
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
          {canCancel ? (
            <Button variant="secondary" size="sm" onClick={() => setCancelOpen(true)}>
              Cancel order
            </Button>
          ) : null}
        </div>
      </div>

      {/* progress */}
      <section
        aria-labelledby="order-progress"
        className="mt-8 rounded-xl border border-border bg-surface p-5"
      >
        <h2 id="order-progress" className="text-base font-semibold text-ink">
          Order progress
        </h2>
        {isCancelled ? (
          <p
            role="status"
            className="mt-3 rounded-lg border border-error/30 bg-error-soft px-4 py-3 text-sm font-medium text-error"
          >
            This order was cancelled. If a payment was taken, any eligible refund will be
            processed to your original payment method.
          </p>
        ) : (
          <OrderTimeline status={order.status} />
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* items */}
        <section aria-labelledby="order-items" className="rounded-xl border border-border bg-surface p-5">
          <h2 id="order-items" className="text-base font-semibold text-ink">
            Items
          </h2>
          <ul className="mt-4 divide-y divide-border">
            {(order.items ?? []).map((item, index) => (
              <li key={item.id ?? index} className="flex items-start gap-4 py-4 text-sm">
                <ItemThumb productId={item.productId} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{item.productName}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {[item.size, item.color].filter(Boolean).join(" / ")} · Qty {item.quantity} ·{" "}
                    {formatPrice(item.unitPrice)} each
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="font-medium text-ink">{formatPrice(item.totalPrice)}</span>
                    <button
                      type="button"
                      onClick={() => buyAgain(item)}
                      disabled={buyingId === item.id}
                      className="text-xs font-medium text-primary transition-colors hover:text-primary-hover disabled:opacity-50"
                    >
                      {buyingId === item.id ? "Adding…" : "Buy again"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-ink">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery fee</dt>
              <dd className="font-medium text-ink">{formatPrice(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Discount</dt>
              <dd className="font-medium text-ink">{formatPrice(order.discount)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-semibold text-ink">{formatPrice(order.totalAmount)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          {/* delivery */}
          <section aria-labelledby="order-delivery" className="rounded-xl border border-border bg-surface p-5">
            <h2 id="order-delivery" className="text-base font-semibold text-ink">
              Delivery
            </h2>
            {delivery ? (
              <div className="mt-3 space-y-3 text-sm">
                <Badge tone={deliveryStatusTone(delivery.status)}>
                  {deliveryStatusLabel(delivery.status)}
                </Badge>
                {rider ? (
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Your rider
                    </p>
                    <p className="mt-1 font-medium text-ink">
                      {[rider.user?.firstName, rider.user?.lastName].filter(Boolean).join(" ") ||
                        "Assigned rider"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {[rider.vehicleType, rider.vehicleNumber].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted">A rider will be assigned before dispatch.</p>
                )}
                <dl className="space-y-1 text-xs text-muted">
                  {delivery.pickedUpAt ? (
                    <div className="flex justify-between gap-3">
                      <dt>Picked up</dt>
                      <dd>{formatDateTime(delivery.pickedUpAt)}</dd>
                    </div>
                  ) : null}
                  {delivery.outForDeliveryAt ? (
                    <div className="flex justify-between gap-3">
                      <dt>Out for delivery</dt>
                      <dd>{formatDateTime(delivery.outForDeliveryAt)}</dd>
                    </div>
                  ) : null}
                  {delivery.deliveredAt ? (
                    <div className="flex justify-between gap-3">
                      <dt>Delivered</dt>
                      <dd>{formatDateTime(delivery.deliveredAt)}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Delivery is not scheduled yet — our team will arrange it after confirming your
                order.
              </p>
            )}
          </section>

          {/* address */}
          <section aria-labelledby="order-address" className="rounded-xl border border-border bg-surface p-5">
            <h2 id="order-address" className="text-base font-semibold text-ink">
              Delivery address
            </h2>
            {order.address ? (
              <div className="mt-3 text-sm">
                <p className="font-medium text-ink">{order.address.recipientName}</p>
                <p className="mt-1 text-muted">{order.address.addressLine}</p>
                <p className="text-muted">
                  {[order.address.city, order.address.state, order.address.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="mt-1 text-xs text-muted">{order.address.phone}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No address on record.</p>
            )}
          </section>

          {/* payments */}
          <section aria-labelledby="order-payment" className="rounded-xl border border-border bg-surface p-5">
            <h2 id="order-payment" className="text-base font-semibold text-ink">
              Payment
            </h2>
            {payments.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No payment recorded yet — our team will confirm payment with you.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block font-medium text-ink">
                        {paymentMethodLabel(payment.method)}
                      </span>
                      <span className="mt-1 block">
                        <Badge tone={paymentStatusTone(payment.status)}>
                          {paymentStatusLabel(payment.status)}
                        </Badge>
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {formatDateTime(payment.createdAt)}
                      </span>
                    </span>
                    <span className="font-medium text-ink">{formatPrice(payment.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => (cancelling ? null : setCancelOpen(false))}
        title="Cancel this order?"
        description="This cannot be undone. Cancelling only works while an order is still Pending or Confirmed."
        footer={
          <>
            <Button variant="ghost" disabled={cancelling} onClick={() => setCancelOpen(false)}>
              Keep order
            </Button>
            <Button variant="danger" loading={cancelling} onClick={cancelOrder}>
              Yes, cancel order
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Order <span className="font-medium text-ink">{order.orderNumber}</span> for{" "}
          <span className="font-medium text-ink">{formatPrice(order.totalAmount)}</span> will be
          cancelled.
        </p>
      </Modal>
    </div>
  );
}