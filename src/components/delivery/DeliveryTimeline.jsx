import { deliveryTimeline } from "@/lib/delivery";
import { formatDateTime } from "@/lib/orders";

function StepDot({ state }) {
  if (state === "completed") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary-soft">
        <span className="size-2.5 rounded-full bg-primary" />
      </span>
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface">
      <span className="size-2.5 rounded-full bg-border" />
    </span>
  );
}

/** Delivery progress stages. Renders nothing for CANCELLED deliveries. */
export default function DeliveryTimeline({ status }) {
  const stages = deliveryTimeline(status);
  if (stages.length === 0) return null;

  return (
    <ol className="mt-4">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        const done = stage.state === "completed";
        const current = stage.state === "current";
        return (
          <li key={stage.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepDot state={stage.state} />
              {!isLast ? (
                <span className={`w-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} aria-hidden="true" />
              ) : null}
            </div>
            <div className={isLast ? "" : "pb-5"}>
              <p
                className={`text-sm font-medium ${
                  current ? "text-primary" : done ? "text-ink" : "text-muted"
                }`}
              >
                {stage.label}
                {current ? (
                  <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                    Now
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted">{stage.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Chronological audit trail of every status change on a delivery. */
export function EventTimeline({ events = [] }) {
  if (events.length === 0) return null;
  return (
    <ol className="mt-4 space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <div>
            <p className="text-sm text-ink">
              <span className="font-medium">{event.previousStatus ? `${event.previousStatus} → ` : ""}</span>
              <span className="font-medium">{event.newStatus}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {formatDateTime(event.createdAt)}
              {event.actor ? ` · ${event.actor.firstName} ${event.actor.lastName}` : ""}
            </p>
            {event.note ? <p className="mt-1 text-xs text-muted italic">{event.note}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}