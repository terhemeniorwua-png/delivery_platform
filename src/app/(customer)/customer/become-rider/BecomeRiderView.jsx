"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button, { buttonClassName } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { formatDateTime } from "@/lib/orders";

const VEHICLE_OPTIONS = [
  { value: "MOTORCYCLE", label: "Motorcycle" },
  { value: "BICYCLE", label: "Bicycle" },
  { value: "CAR", label: "Car" },
  { value: "VAN", label: "Van" },
];

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  dateOfBirth: "",
  addressLine: "",
  city: "",
  state: "",
  vehicleType: "MOTORCYCLE",
  vehicleNumber: "",
  licenseNumber: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

function maxDob() {
  const cutoff = new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000);
  return cutoff.toISOString().slice(0, 10);
}

/** Renders the correct state for the customer's rider application. */
export default function BecomeRiderView() {
  const { toast } = useToast();
  const [application, setApplication] = useState(undefined);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/rider-applications/me")
      .then((data) => {
        if (cancelled) return;
        setApplication(data.application ?? null);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (application === undefined && !error) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4" aria-hidden="true">
        <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-error/30 bg-error-soft px-6 py-8 text-center">
        <p className="text-sm font-medium text-error">{getApiErrorMessage(error)}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAttempt((value) => value + 1);
          }}
          className="mt-3 text-sm font-medium text-primary hover:text-primary-hover"
        >
          Try again
        </button>
      </div>
    );
  }

  if (application && !(application.status === "REJECTED" && showForm)) {
    return (
      <ApplicationStatus
        application={application}
        onReapply={() => setShowForm(true)}
      />
    );
  }

  return (
    <RiderApplicationForm
      onSubmitted={(submitted) => {
        setApplication(submitted);
        setShowForm(false);
        toast("Rider application submitted", { type: "success" });
      }}
      rejectionReason={application?.rejectionReason}
    />
  );
}

function ApplicationStatus({ application, onReapply }) {
  const { status } = application;

  if (status === "APPROVED") {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-xl border border-success/30 bg-success-soft p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/70 text-xl text-success">
            ✓
          </span>
          <h1 className="mt-4 text-xl font-semibold text-ink">
            Your rider application was approved
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your account now has the rider role. Head to your rider workspace.
          </p>
          <div className="mt-5 flex justify-center">
            <Link href="/rider" className={buttonClassName()}>
              Go to rider dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Rider application
          </h1>
          <p className="mt-1 text-sm text-muted">
            Thanks for applying — you can track the review here.
          </p>
        </div>

        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Application status</h2>
            <Badge tone="warning">Under review</Badge>
          </div>
          <p className="mt-3 text-sm text-muted">
            An admin will review your application. This usually takes a short while. You&apos;ll
            keep your customer access in the meantime.
          </p>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Submitted</dt>
              <dd className="font-medium text-ink">{formatDateTime(application.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Vehicle</dt>
              <dd className="font-medium text-ink">
                {application.vehicleType} · {application.vehicleNumber}
              </dd>
            </div>
          </dl>
        </section>

        <div>
          <Link href="/customer" className={buttonClassName("secondary")}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // REJECTED
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <section className="rounded-xl border border-error/30 bg-error-soft p-6">
        <h1 className="text-xl font-semibold text-ink">Rider application not approved</h1>
        <p className="mt-2 text-sm text-muted">
          You can review the reason and apply again whenever you&apos;re ready.
        </p>
        {application.rejectionReason ? (
          <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink">
            <span className="font-medium">Reason:</span> {application.rejectionReason}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={onReapply}>Reapply</Button>
          <Link href="/customer" className={buttonClassName("secondary")}>
            Back to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function RiderApplicationForm({ onSubmitted, rejectionReason }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "Enter your full name.";
    if (!/^\+?[\d\s-]{7,}$/.test(form.phone.trim()))
      errors.phone = "Enter a valid phone number.";
    if (!form.dateOfBirth) errors.dateOfBirth = "Enter your date of birth.";
    if (!form.addressLine.trim()) errors.addressLine = "Enter your address.";
    if (!form.city.trim()) errors.city = "Enter your city.";
    if (!form.state.trim()) errors.state = "Enter your state.";
    if (!form.vehicleNumber.trim()) errors.vehicleNumber = "Enter your vehicle number.";
    if (!form.licenseNumber.trim()) errors.licenseNumber = "Enter your licence number.";
    if (!form.emergencyContactName.trim())
      errors.emergencyContactName = "Enter an emergency contact name.";
    if (!/^\+?[\d\s-]{7,}$/.test(form.emergencyContactPhone.trim()))
      errors.emergencyContactPhone = "Enter a valid emergency contact phone.";
    return errors;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please correct the highlighted fields.");
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const data = await api.post("/rider-applications", {
        ...form,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        addressLine: form.addressLine.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        vehicleNumber: form.vehicleNumber.trim(),
        licenseNumber: form.licenseNumber.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
      });
      onSubmitted(data.application);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setFormError(message);
      toast(message, { type: "error" });
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Become a delivery rider
        </h1>
        <p className="mt-1 text-sm text-muted">
          Apply to deliver orders with Clothing Delivery. An admin reviews every application.
        </p>
      </div>

      {rejectionReason ? (
        <p className="rounded-lg border border-error/30 bg-error-soft px-4 py-3 text-sm text-error">
          Your previous application was rejected: {rejectionReason}
        </p>
      ) : null}

      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error-soft px-4 py-3 text-sm font-medium text-error"
        >
          {formError}
        </p>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <fieldset className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <legend className="px-1 text-sm font-semibold text-ink">Personal details</legend>
          <div className="mt-4 space-y-4">
            <Input
              label="Full name"
              name="fullName"
              autoComplete="name"
              required
              value={form.fullName}
              onChange={(event) => set("fullName", event.target.value)}
              error={fieldErrors.fullName}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Phone number"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
                error={fieldErrors.phone}
              />
              <Input
                label="Date of birth"
                name="dateOfBirth"
                type="date"
                required
                max={maxDob()}
                value={form.dateOfBirth}
                onChange={(event) => set("dateOfBirth", event.target.value)}
                error={fieldErrors.dateOfBirth}
                hint="You must be at least 18."
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <legend className="px-1 text-sm font-semibold text-ink">Address</legend>
          <div className="mt-4 space-y-4">
            <Input
              label="Address line"
              name="addressLine"
              autoComplete="street-address"
              required
              value={form.addressLine}
              onChange={(event) => set("addressLine", event.target.value)}
              error={fieldErrors.addressLine}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="City"
                name="city"
                required
                value={form.city}
                onChange={(event) => set("city", event.target.value)}
                error={fieldErrors.city}
              />
              <Input
                label="State"
                name="state"
                required
                value={form.state}
                onChange={(event) => set("state", event.target.value)}
                error={fieldErrors.state}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <legend className="px-1 text-sm font-semibold text-ink">Vehicle &amp; licence</legend>
          <div className="mt-4 space-y-4">
            <Select
              label="Vehicle type"
              name="vehicleType"
              value={form.vehicleType}
              onChange={(event) => set("vehicleType", event.target.value)}
            >
              {VEHICLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Vehicle number"
                name="vehicleNumber"
                required
                value={form.vehicleNumber}
                onChange={(event) => set("vehicleNumber", event.target.value)}
                error={fieldErrors.vehicleNumber}
              />
              <Input
                label="Licence number"
                name="licenseNumber"
                required
                value={form.licenseNumber}
                onChange={(event) => set("licenseNumber", event.target.value)}
                error={fieldErrors.licenseNumber}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <legend className="px-1 text-sm font-semibold text-ink">Emergency contact</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Contact name"
              name="emergencyContactName"
              required
              value={form.emergencyContactName}
              onChange={(event) => set("emergencyContactName", event.target.value)}
              error={fieldErrors.emergencyContactName}
            />
            <Input
              label="Contact phone"
              name="emergencyContactPhone"
              type="tel"
              required
              value={form.emergencyContactPhone}
              onChange={(event) => set("emergencyContactPhone", event.target.value)}
              error={fieldErrors.emergencyContactPhone}
            />
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/customer" className={buttonClassName("secondary")}>
            Cancel
          </Link>
          <Button type="submit" loading={submitting}>
            Submit application
          </Button>
        </div>
      </form>
    </div>
  );
}