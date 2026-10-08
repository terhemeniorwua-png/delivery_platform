/** Shared presentation helpers for order records (backend statuses only). */

const STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_TONES = {
  PENDING: "warning",
  CONFIRMED: "primary",
  PROCESSING: "primary",
  READY_FOR_PICKUP: "primary",
  OUT_FOR_DELIVERY: "primary",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const PAYMENT_LABELS = {
  PENDING: "Awaiting confirmation",
  SUCCESSFUL: "Confirmed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const PAYMENT_TONES = {
  PENDING: "warning",
  SUCCESSFUL: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};

const PAYMENT_METHOD_LABELS = {
  CASH: "Cash on delivery",
  CARD: "Card",
  TRANSFER: "Bank transfer",
};

const DELIVERY_LABELS = {
  PENDING: "Awaiting a rider",
  ASSIGNED: "Rider assigned",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const DELIVERY_TONES = {
  PENDING: "warning",
  ASSIGNED: "primary",
  PICKED_UP: "primary",
  IN_TRANSIT: "primary",
  DELIVERED: "success",
  CANCELLED: "danger",
};

/** Ordered happy-path stages shared by the order timeline (backend statuses). */
export const ORDER_STAGES = [
  { key: "PENDING", label: "Order placed", description: "We received your order." },
  { key: "CONFIRMED", label: "Confirmed", description: "Your order has been confirmed." },
  { key: "PROCESSING", label: "Processing", description: "We're preparing your items." },
  {
    key: "READY_FOR_PICKUP",
    label: "Ready for pickup",
    description: "Packed and waiting for a rider.",
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    description: "A rider is on the way.",
  },
  { key: "DELIVERED", label: "Delivered", description: "Enjoy your order!" },
];

export function orderStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "Unknown";
}

export function orderStatusTone(status) {
  return STATUS_TONES[status] ?? "neutral";
}

export function paymentStatusLabel(status) {
  return PAYMENT_LABELS[status] ?? status ?? "Unknown";
}

export function paymentStatusTone(status) {
  return PAYMENT_TONES[status] ?? "neutral";
}

export function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? method ?? "Unknown";
}

export function deliveryStatusLabel(status) {
  return DELIVERY_LABELS[status] ?? status ?? "Unknown";
}

export function deliveryStatusTone(status) {
  return DELIVERY_TONES[status] ?? "neutral";
}

/**
 * Timeline stages annotated for the current order status.
 * `state` is one of: "completed" | "current" | "upcoming".
 * Returns [] for CANCELLED orders — callers show a cancellation notice
 * instead of a progress timeline.
 */
export function orderTimeline(status) {
  if (!status || status === "CANCELLED") return [];
  const currentIndex = ORDER_STAGES.findIndex((stage) => stage.key === status);
  const effectiveIndex =
    currentIndex === -1 ? ORDER_STAGES.length - 1 : currentIndex;
  return ORDER_STAGES.map((stage, index) => ({
    ...stage,
    state:
      index < effectiveIndex
        ? "completed"
        : index === effectiveIndex
          ? "current"
          : "upcoming",
  }));
}

/** "8 Oct 2026, 10:32" from an ISO timestamp. */
export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
