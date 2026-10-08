/**
 * Delivery + rider presentation helpers.
 *
 * All status/availability values mirror the backend enums (constants/status.js)
 * exactly — the backend stays the single source of truth for every transition.
 */
import { deliveryStatusLabel, deliveryStatusTone } from "@/lib/orders";

export { deliveryStatusLabel, deliveryStatusTone };

/** Backend delivery statuses, in flow order. */
export const DELIVERY_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
];

/** Statuses that count as "in progress" (mirrors DELIVERY_TRANSITIONS keys). */
export const DELIVERY_ACTIVE_STATUSES = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

/** Ordered happy-path stages for the delivery progress timeline. */
export const DELIVERY_STAGES = [
  { key: "PENDING", label: "Pending", description: "Waiting for a rider to be assigned." },
  { key: "ASSIGNED", label: "Assigned", description: "A rider has been assigned to this order." },
  { key: "PICKED_UP", label: "Picked up", description: "The rider collected the parcel." },
  { key: "IN_TRANSIT", label: "In transit", description: "On the way to the customer." },
  { key: "DELIVERED", label: "Delivered", description: "Handed over to the customer." },
];

/**
 * Timeline stages annotated for the current delivery status.
 * `state` is one of: "completed" | "current" | "upcoming".
 * Returns [] for CANCELLED deliveries (callers show a cancellation notice).
 */
export function deliveryTimeline(status) {
  if (!status || status === "CANCELLED") return [];
  const index = DELIVERY_STAGES.findIndex((stage) => stage.key === status);
  const effective = index === -1 ? DELIVERY_STAGES.length - 1 : index;
  return DELIVERY_STAGES.map((stage, i) => ({
    ...stage,
    state: i < effective ? "completed" : i === effective ? "current" : "upcoming",
  }));
}

/**
 * The single status a RIDER may move a delivery to, per the backend
 * DELIVERY_TRANSITIONS (riders can never cancel). Used to render the one
 * action button on the rider's active delivery.
 */
export const RIDER_ACTIONS = {
  ASSIGNED: {
    status: "PICKED_UP",
    label: "Mark as picked up",
    description: "Confirm you collected the parcel from the store.",
  },
  PICKED_UP: {
    status: "IN_TRANSIT",
    label: "Start delivery",
    description: "Let the customer know you are on the way.",
  },
  IN_TRANSIT: {
    status: "DELIVERED",
    label: "Mark as delivered",
    description: "Confirm the parcel was handed to the customer.",
  },
};

/** Rider availability (backend enum RIDER_AVAILABILITY). */
export const AVAILABILITY = {
  AVAILABLE: {
    label: "Available",
    tone: "success",
    description: "You can receive new delivery jobs.",
  },
  BUSY: {
    label: "Busy",
    tone: "warning",
    description: "You have delivery work in progress. Set automatically.",
  },
  OFFLINE: {
    label: "Offline",
    tone: "neutral",
    description: "You are not accepting delivery work.",
  },
};

export function availabilityLabel(value) {
  return AVAILABILITY[value]?.label ?? value ?? "Unknown";
}

export function availabilityTone(value) {
  return AVAILABILITY[value]?.tone ?? "neutral";
}

/** "MOTORCYCLE" -> "Motorcycle" */
export function vehicleLabel(value) {
  if (!value) return "—";
  return value.charAt(0) + value.slice(1).toLowerCase();
}