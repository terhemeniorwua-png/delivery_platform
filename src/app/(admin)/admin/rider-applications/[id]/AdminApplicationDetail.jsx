"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/orders";
import { vehicleLabel } from "@/lib/delivery";

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value || "—"}</span>
    </div>
  );
}

function statusTone(status) {
  if (status === "PENDING") return "warning";
  if (status === "APPROVED") return "success";
  return "danger";
}

/** DATEONLY values are calendar dates — render without a UTC shift. */
function formatDateOnly(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminApplicationDetail({ applicationId }) {
  const { toast } = useToast();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/rider-applications/${applicationId}`)
      .then((result) => {
        if (cancelled) return;
        setApplication(result.application);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, attempt]);

  function refresh() {
    setApplication(null);
    setError(null);
    setAttempt((value) => value + 1);
  }

  async function approve() {
    setSubmitting(true);
    try {
      await api.patch(`/rider-applications/${applicationId}/approve`);
      toast("Application approved. The applicant can now take deliveries.", { type: "success" });
      setConfirming(false);
      refresh();
    } catch (err) {
      toast(getApiErrorMessage(err), { type: "error" });
      setConfirming(false);
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function reject() {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/rider-applications/${applicationId}/reject`, { reason: reason.trim() });
      toast("Application rejected.", { type: "success" });
      setRejecting(false);
      setReason("");
      refresh();
    } catch (err) {
      toast(getApiErrorMessage(err), { type: "error" });
      setRejecting(false);
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load this application"
        message={getApiErrorMessage(error)}
        onRetry={refresh}
      />
    );
  }

  if (!application) return <CenteredSpinner label="Loading application" />;

  const applicant = application.user ?? {};
  const pending = application.status === "PENDING";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/rider-applications"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            &larr; Back to applications
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">
            {application.fullName}
          </h1>
          <p className="mt-1 text-sm text-muted">Submitted {formatDateTime(application.createdAt)}</p>
        </div>
        <Badge tone={statusTone(application.status)}>{application.status}</Badge>
      </div>

      {pending ? (
        <section className="rounded-xl border border-primary/30 bg-primary-soft p-5">
          <p className="text-sm font-medium text-ink">This application is awaiting review.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => setConfirming(true)}>Approve application</Button>
            <Button variant="danger" onClick={() => setRejecting(true)}>
              Reject application
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-medium text-ink">Review outcome</p>
          <div className="mt-2 divide-y divide-border">
            <Row
              label="Reviewed"
              value={application.reviewedAt ? formatDateTime(application.reviewedAt) : "—"}
            />
            <Row label="Reviewed by" value={application.reviewedBy ? "Administrator" : "—"} />
            {application.status === "REJECTED" ? (
              <Row label="Rejection reason" value={application.rejectionReason} />
            ) : null}
          </div>
          {application.status === "REJECTED" ? (
            <p className="mt-3 text-xs text-muted">
              The applicant keeps their customer account and may reapply.
            </p>
          ) : null}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Applicant</h2>
            {applicant.role ? <Badge tone="neutral">{applicant.role}</Badge> : null}
          </div>
          <div className="mt-2 divide-y divide-border">
            <Row label="Full name" value={application.fullName} />
            <Row label="Email address" value={applicant.email} />
            <Row label="Phone" value={application.phone} />
            <Row label="Date of birth" value={formatDateOnly(application.dateOfBirth)} />
            <Row label="Address" value={application.addressLine} />
            <Row label="City" value={application.city} />
            <Row label="State" value={application.state} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Vehicle &amp; emergency contact</h2>
          <div className="mt-2 divide-y divide-border">
            <Row label="Vehicle type" value={vehicleLabel(application.vehicleType)} />
            <Row label="Vehicle number" value={application.vehicleNumber} />
            <Row label="License number" value={application.licenseNumber} />
            <Row label="Emergency contact" value={application.emergencyContactName} />
            <Row label="Emergency phone" value={application.emergencyContactPhone} />
          </div>
        </section>
      </div>

      {/* --- Approve confirmation (no native confirm()) --- */}
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Approve this application?"
        description={`${application.fullName} will become a rider and can start taking deliveries.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={approve} loading={submitting}>
              Approve
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          The applicant&apos;s account role changes to RIDER. Their vehicle details are copied to a new
          rider profile, starting offline.
        </p>
      </Modal>

      {/* --- Reject with reason --- */}
      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject this application?"
        description="Tell the applicant why their application cannot be approved."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={reject} loading={submitting} disabled={!reason.trim()}>
              Reject application
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason for rejection"
          name="reason"
          rows={4}
          required
          hint="Required. Shared with the applicant (max 300 characters)."
          maxLength={300}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Modal>
    </div>
  );
}