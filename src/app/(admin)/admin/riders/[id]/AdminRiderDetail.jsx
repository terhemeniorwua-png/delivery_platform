"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import StatCard from "@/components/dashboard/StatCard";
import { availabilityLabel, availabilityTone, vehicleLabel } from "@/lib/delivery";

const ACCOUNT_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

function accountTone(status) {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "danger";
  return "warning";
}

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value || "—"}</span>
    </div>
  );
}

export default function AdminRiderDetail({ riderId }) {
  const { toast } = useToast();
  const [rider, setRider] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [statusModal, setStatusModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/riders/${riderId}`)
      .then((result) => {
        if (cancelled) return;
        setRider(result.rider);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [riderId, attempt]);

  async function changeStatus() {
    if (!statusModal || !rider?.user) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${rider.user.id}/status`, { status: statusModal });
      toast(`Account status set to ${statusModal}.`, { type: "success" });
      setStatusModal(null);
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
        title="Unable to load this rider"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  if (!rider) return <CenteredSpinner label="Loading rider" />;

  const user = rider.user ?? {};
  const stats = rider.deliveryStats ?? { active: 0, delivered: 0, cancelled: 0, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/riders" className="text-sm font-medium text-primary hover:text-primary-hover">
            &larr; Back to riders
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">
            {user.firstName} {user.lastName}
          </h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <Badge tone={availabilityTone(rider.availability)}>
          {availabilityLabel(rider.availability)}
        </Badge>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total deliveries" value={stats.total} tone="neutral" />
        <StatCard label="Active deliveries" value={stats.active} tone="primary" />
        <StatCard label="Completed deliveries" value={stats.delivered} tone="success" />
        <StatCard label="Cancelled deliveries" value={stats.cancelled} tone="danger" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Personal information</h2>
            <Badge tone={accountTone(user.status)}>{user.status}</Badge>
          </div>
          <div className="mt-2 divide-y divide-border">
            <Row label="Full name" value={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()} />
            <Row label="Email address" value={user.email} />
            <Row label="Phone" value={user.phone} />
            <Row label="Role" value={user.role} />
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-medium text-ink">Account status</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ACCOUNT_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={status === user.status}
                  onClick={() => setStatusModal(status)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    status === user.status
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-muted hover:border-primary/40 hover:text-ink"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Rider information</h2>
          <div className="mt-2 divide-y divide-border">
            <Row label="Vehicle type" value={vehicleLabel(rider.vehicleType)} />
            <Row label="Vehicle number" value={rider.vehicleNumber} />
            <Row label="Availability" value={availabilityLabel(rider.availability)} />
            <Row label="Rider ID" value={rider.id} />
          </div>
          <p className="mt-4 text-xs text-muted">
            Availability is controlled by the rider and the delivery workflow — it is read-only for
            administrators.
          </p>
        </section>
      </div>

      <Modal
        open={Boolean(statusModal)}
        onClose={() => setStatusModal(null)}
        title="Change account status?"
        description={`Set ${user.firstName} ${user.lastName} to ${statusModal}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusModal(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={changeStatus} loading={submitting}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Suspended riders cannot sign in or perform rider actions until reactivated.
        </p>
      </Modal>
    </div>
  );
}