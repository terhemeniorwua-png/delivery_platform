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

export function orderStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "Unknown";
}

export function orderStatusTone(status) {
  return STATUS_TONES[status] ?? "neutral";
}

export function paymentStatusLabel(status) {
  return PAYMENT_LABELS[status] ?? status ?? "Unknown";
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
