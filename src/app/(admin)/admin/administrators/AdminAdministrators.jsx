"use client";

import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import Table from "@/components/admin/Table";
import { formatDateTime } from "@/lib/orders";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

export default function AdminAdministrators() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [demoteTarget, setDemoteTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/administrators")
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function refresh() {
    setAttempt((value) => value + 1);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
  }

  function validate() {
    const errors = {};
    if (form.firstName.trim().length < 2) errors.firstName = "Enter a first name (2+ characters).";
    if (form.lastName.trim().length < 2) errors.lastName = "Enter a last name (2+ characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errors.email = "Enter a valid email address.";
    if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      errors.password = "Password must contain a letter and a number.";
    if (form.phone.trim() && !/^\+?[0-9][0-9\s-]{6,19}$/.test(form.phone.trim()))
      errors.phone = "Enter a valid phone number.";
    return errors;
  }

  async function createAdministrator(event) {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/admin/administrators", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      });
      toast(`${form.firstName.trim()} ${form.lastName.trim()} is now an administrator.`, {
        type: "success",
      });
      setForm(EMPTY_FORM);
      setFieldErrors({});
      refresh();
    } catch (err) {
      setFieldErrors({ form: getApiErrorMessage(err) });
      toast(getApiErrorMessage(err), { type: "error" });
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function demote() {
    if (!demoteTarget) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${demoteTarget.id}/role`, { role: "CUSTOMER" });
      toast(`${demoteTarget.firstName} is no longer an administrator.`, { type: "success" });
      setDemoteTarget(null);
      refresh();
    } catch (err) {
      toast(getApiErrorMessage(err), { type: "error" });
      setDemoteTarget(null);
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load administrators"
        message={getApiErrorMessage(error)}
        onRetry={refresh}
      />
    );
  }

  if (!data) return <CenteredSpinner label="Loading administrators" />;

  const atLimit = Boolean(data.atLimit);
  const width = Math.min(100, Math.round((data.count / data.limit) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Administrators</h1>
        <p className="mt-1 text-sm text-muted">
          Manage who can access the admin console. A maximum of {data.limit} administrators is
          allowed.
        </p>
      </div>

      {/* --- Capacity (11.5) --- */}
      <section
        className={`rounded-xl border p-5 ${
          atLimit ? "border-error/40 bg-error-soft" : "border-border bg-surface"
        }`}
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Capacity</h2>
            <p className="mt-1 text-sm text-muted">
              {atLimit
                ? "Maximum administrator capacity reached. Create is disabled until a slot frees up."
                : `${data.remaining} of ${data.limit} slots available.`}
            </p>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-ink">
            {data.count} <span className="text-muted">/ {data.limit}</span>
          </p>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className={`h-full rounded-full ${atLimit ? "bg-error" : "bg-primary"}`}
            style={{ width: `${width}%` }}
            role="progressbar"
            aria-valuenow={data.count}
            aria-valuemin={0}
            aria-valuemax={data.limit}
            aria-label="Administrator capacity"
          />
        </div>
      </section>

      {/* --- Create administrator (disabled at 5) --- */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Create an administrator</h2>
            <p className="mt-1 text-sm text-muted">
              New administrators can sign in to the admin console immediately.
            </p>
          </div>
          {atLimit ? <Badge tone="danger">Limit reached</Badge> : null}
        </div>

        {fieldErrors.form ? (
          <p role="alert" className="mt-4 rounded-lg border border-error/40 bg-error-soft px-3 py-2 text-sm text-error">
            {fieldErrors.form}
          </p>
        ) : null}

        <form onSubmit={createAdministrator} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
          <Input
            label="First name"
            name="firstName"
            value={form.firstName}
            onChange={updateField}
            error={fieldErrors.firstName}
            required
            disabled={atLimit || submitting}
          />
          <Input
            label="Last name"
            name="lastName"
            value={form.lastName}
            onChange={updateField}
            error={fieldErrors.lastName}
            required
            disabled={atLimit || submitting}
          />
          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="off"
            value={form.email}
            onChange={updateField}
            error={fieldErrors.email}
            required
            disabled={atLimit || submitting}
          />
          <Input
            label="Phone (optional)"
            name="phone"
            value={form.phone}
            onChange={updateField}
            error={fieldErrors.phone}
            disabled={atLimit || submitting}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={updateField}
            error={fieldErrors.password}
            hint="At least 8 characters with a letter and a number."
            required
            disabled={atLimit || submitting}
          />
          <div className="flex items-end">
            <Button
              type="submit"
              loading={submitting}
              disabled={atLimit}
              title={atLimit ? "Maximum administrators reached" : undefined}
            >
              Create administrator
            </Button>
          </div>
        </form>
      </section>

      {/* --- Administrator list --- */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-ink">Current administrators</h2>
        <Table headers={["Name", "Email", "Phone", "Status", "Joined", ""]} caption="Administrators">
          {data.users.map((admin) => (
            <tr key={admin.id} className="transition-colors hover:bg-background">
              <td className="px-4 py-3 font-medium text-ink">
                {admin.firstName} {admin.lastName}
              </td>
              <td className="px-4 py-3 text-muted">{admin.email}</td>
              <td className="px-4 py-3 text-muted">{admin.phone || "—"}</td>
              <td className="px-4 py-3">
                <Badge tone={admin.status === "ACTIVE" ? "success" : "warning"}>{admin.status}</Badge>
              </td>
              <td className="px-4 py-3 text-muted">{formatDateTime(admin.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  disabled={data.count <= 1}
                  onClick={() => setDemoteTarget(admin)}
                  className="text-sm font-medium text-error transition-colors hover:text-error disabled:cursor-not-allowed disabled:text-muted"
                  title={data.count <= 1 ? "At least one administrator must remain" : undefined}
                >
                  Demote
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </section>

      <Modal
        open={Boolean(demoteTarget)}
        onClose={() => setDemoteTarget(null)}
        title="Demote this administrator?"
        description={
          demoteTarget
            ? `${demoteTarget.firstName} ${demoteTarget.lastName} will become a customer account.`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDemoteTarget(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={demote} loading={submitting}>
              Demote
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          They will lose access to the admin console immediately. Their customer data stays intact.
        </p>
      </Modal>
    </div>
  );
}