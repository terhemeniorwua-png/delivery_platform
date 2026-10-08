"use client";

import { useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { availabilityLabel, availabilityTone } from "@/lib/delivery";

/**
 * Rider availability control.
 *
 * The backend only accepts AVAILABLE / OFFLINE (BUSY is set automatically by
 * the delivery workflow), so the UI offers just those two and treats BUSY as
 * read-only. The backend stays authoritative: the badge only changes after a
 * successful PATCH.
 */
export default function AvailabilityControl({ rider, onUpdated, className = "" }) {
  const { toast } = useToast();
  const [current, setCurrent] = useState(rider?.availability);
  const [pending, setPending] = useState(null);

  // Keep in sync when a freshly fetched rider arrives (adjust during render).
  const [lastRider, setLastRider] = useState(rider);
  if (rider !== lastRider) {
    setLastRider(rider);
    setCurrent(rider?.availability);
  }

  async function update(next) {
    if (pending || next === current) return;
    setPending(next);
    try {
      const data = await api.patch("/riders/me/availability", { availability: next });
      setCurrent(data.rider.availability);
      onUpdated?.(data.rider);
      toast(`You are now ${availabilityLabel(next).toLowerCase()}.`, { type: "success" });
    } catch (err) {
      toast(getApiErrorMessage(err), { type: "error" });
    } finally {
      setPending(null);
    }
  }

  const busy = current === "BUSY";

  return (
    <div className={`rounded-xl border border-border bg-surface p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Availability</h2>
          <p className="mt-1 text-sm text-muted">
            Control whether new delivery jobs can be assigned to you.
          </p>
        </div>
        <Badge tone={availabilityTone(current)}>{availabilityLabel(current)}</Badge>
      </div>

      {busy ? (
        <p className="mt-4 rounded-lg border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning">
          You have an active delivery. Availability switches back to
          <span className="font-medium"> Available </span>
          automatically when you finish it.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant={current === "AVAILABLE" ? "primary" : "secondary"}
          loading={pending === "AVAILABLE"}
          disabled={current === "AVAILABLE" || busy}
          onClick={() => update("AVAILABLE")}
        >
          Go available
        </Button>
        <Button
          variant={current === "OFFLINE" ? "primary" : "secondary"}
          loading={pending === "OFFLINE"}
          disabled={current === "OFFLINE"}
          onClick={() => update("OFFLINE")}
        >
          Go offline
        </Button>
      </div>
    </div>
  );
}