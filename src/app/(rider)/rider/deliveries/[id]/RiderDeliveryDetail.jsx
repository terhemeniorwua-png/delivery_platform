"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import DeliveryTimeline, { EventTimeline } from "@/components/delivery/DeliveryTimeline";
import {
  deliveryStatusLabel,
  deliveryStatusTone,
  RIDER_ACTIONS,
} from "@/lib/delivery";
import { formatDateTime } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export default function RiderDeliveryDetail({ deliveryId }) {
  const { toast } = useToast();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [action, setAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/deliveries/${deliveryId}`)
      .then((result) => {
        if (cancelled) return;
        setDelivery(result.delivery);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [deliveryId, attempt]);

  async function confirmAction() {
    if (!action) return;
    setSubmitting(true);
    try {
      await api.patch(`/deliveries/${deliveryId}/status`, { status: action.status });
      toast(`Delivery marked as ${action.status.replace("_", " ").toLowerCase()}.`, {
        type: "success",
      });
      setAction(null);
      setAttempt((value) => value + 1);
    } catch (err) {
      toast(getApiErrorMessage(err), { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load this delivery"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  if (!delivery) return <CenteredSpinner label="Loading delivery" />;

  const order = delivery.order ?? {};
  const address = order.address ?? {};
  const items = order.items ?? [];
  const next = RIDER_ACTIONS[delivery.status];
  const cancelled = delivery.status === "CANCELLED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/rider/deliveries" className="text-sm font-medium text-primary hover:text-primary-hover">
            &larr; Back to deliveries
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">
            {order.orderNumber ?? "Delivery"}
          </h1>
          <p className="mt-1 text-sm text-muted">Created {formatDateTime(delivery.createdAt)}</p>
        </div>
        <Badge tone={deliveryStatusTone(delivery.status)}>
          {deliveryStatusLabel(delivery.status)}
        </Badge>
      </div>

      {cancelled ? (
        <div
          role="alert"
          className="rounded-xl border border-error/30 bg-error-soft px-4 py-4 text-sm text-ink"
        >
          <p className="font-semibold text-error">This delivery was cancelled</p>
          <p className="mt-1 text-muted">No further status updates are possible.</p>
        </div>
      ) : (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Progress</h2>
          <DeliveryTimeline status={delivery.status} />

          {next ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary-soft p-4">
              <div>
                <p className="text-sm font-medium text-ink">{next.label}</p>
                <p className="mt-0.5 text-xs text-muted">{next.description}</p>
              </div>
              <Button onClick={() => setAction(next)}>{next.label}</Button>
            </div>
          ) : delivery.status === "DELIVERED" ? (
            <p className="mt-4 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-ink">
              Delivered {delivery.deliveredAt ? formatDateTime(delivery.deliveredAt) : ""}
            </p>
          ) : null}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Delivery address</h2>
          <p className="mt-3 text-sm font-medium text-ink">
            {address.recipientName || order.customer?.firstName || "Customer"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {[address.addressLine, address.city, address.state, address.country]
              .filter(Boolean)
              .join(", ") || "Address on file"}
          </p>
          {address.phone ? <p className="mt-1 text-sm text-muted">{address.phone}</p> : null}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Order items</h2>
            <span className="text-sm font-semibold text-ink">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
          {items.length === 0 ? (
            <EmptyState className="mt-3" title="No items listed" />
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.productName}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {[item.size, item.color].filter(Boolean).join(" · ")} · qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm text-muted">{formatPrice(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Activity history</h2>
        <EventTimeline events={delivery.events ?? []} />
      </section>

      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={action?.label ?? "Confirm delivery update"}
        description={action?.description}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={confirmAction} loading={submitting}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          This updates the delivery status for {order.orderNumber ?? "this order"}. The change is
          saved on the server and shown to the customer.
        </p>
      </Modal>
    </div>
  );
}