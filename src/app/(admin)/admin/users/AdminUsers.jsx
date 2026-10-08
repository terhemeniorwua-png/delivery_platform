"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import { buildQuery } from "@/lib/url";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button, { buttonClassName } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import Pagination from "@/components/storefront/Pagination";
import Table from "@/components/admin/Table";
import { formatDateTime } from "@/lib/orders";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

const ROLE_FILTERS = [
  { value: "", label: "All roles" },
  { value: "CUSTOMER", label: "Customers" },
  { value: "RIDER", label: "Riders" },
  { value: "ADMIN", label: "Admins" },
];

const ACCOUNT_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

function statusTone(status) {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "danger";
  return "warning";
}

function roleTone(role) {
  if (role === "ADMIN") return "primary";
  if (role === "RIDER") return "success";
  return "neutral";
}

export default function AdminUsers({ current = {} }) {
  const router = useRouter();
  const { user: me } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const page = Number(current.page) > 0 ? Number(current.page) : 1;
  const status = STATUS_FILTERS.some((f) => f.value === current.status) ? current.status : "";
  const role = ROLE_FILTERS.some((f) => f.value === current.role) ? current.role : "";
  const search = current.search ?? "";

  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const [searchDraft, setSearchDraft] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setSearchDraft(search);
  }

  const [statusFor, setStatusFor] = useState(null);
  const [statusChoice, setStatusChoice] = useState("");
  const [roleFor, setRoleFor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const requestKey = `${page}|${status}|${role}|${search}`;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get("/admin/users", { query: { page, limit: PAGE_SIZE, status, role, search } }),
      api.get("/admin/administrators"),
    ])
      .then(([usersResult, adminsResult]) => {
        if (cancelled) return;
        setData({ ...usersResult, forKey: requestKey });
        setStats(adminsResult);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, role, search, requestKey, attempt]);

  function navigate(changes) {
    startTransition(() => {
      router.replace(`/admin/users${buildQuery(current, changes)}`, { scroll: false });
    });
  }

  function openStatus(user) {
    setStatusFor(user);
    setStatusChoice(user.status);
  }

  async function applyStatus() {
    if (!statusFor) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${statusFor.id}/status`, { status: statusChoice });
      toast(`Account status set to ${statusChoice}.`, { type: "success" });
      setStatusFor(null);
      setAttempt((value) => value + 1);
    } catch (err) {
      toast(getApiErrorMessage(err), { type: "error" });
      setStatusFor(null);
      setAttempt((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function applyRole() {
    if (!roleFor) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${roleFor.user.id}/role`, { role: roleFor.nextRole });
      toast(
        roleFor.nextRole === "ADMIN"
          ? `${roleFor.user.firstName} is now an administrator.`
          : `${roleFor.user.firstName} is now a customer.`,
        { type: "success" }
      );
      setRoleFor(null);
      setAttempt((value) => value + 1);
    } catch (err) {
      toast(getApiErrorMessage(err), { type: "error" });
      setRoleFor(null);
      setAttempt((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load users"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  const loading = (!data || data.forKey !== requestKey) && !error;

  if (loading && !stats) return <CenteredSpinner label="Loading users" />;

  const atLimit = Boolean(stats?.atLimit);
  const lastAdmin = (stats?.count ?? 1) <= 1;
  const filtered = Boolean(status || role || search);
  const users = data?.users ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Users</h1>
          <p className="mt-1 text-sm text-muted">
            Manage accounts, statuses and roles across the platform.
          </p>
        </div>
        {stats ? (
          <p
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              atLimit
                ? "border-error/40 bg-error-soft text-error"
                : "border-border bg-surface text-muted"
            }`}
          >
            Admins: {stats.count} / {stats.limit}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ search: searchDraft.trim(), page: "" });
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="sm:max-w-xs sm:flex-1">
          <Input
            label="Search users"
            type="search"
            name="search"
            placeholder="Name or email"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </div>
        <div className="sm:w-44">
          <label htmlFor="user-status" className="mb-1.5 block text-sm font-medium text-ink">
            Status
          </label>
          <select
            id="user-status"
            value={status}
            onChange={(event) => navigate({ status: event.target.value, page: "" })}
            className="h-9 w-full cursor-pointer rounded-lg border border-border bg-surface px-3 text-sm text-ink"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value || "all"} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-44">
          <label htmlFor="user-role" className="mb-1.5 block text-sm font-medium text-ink">
            Role
          </label>
          <select
            id="user-role"
            value={role}
            onChange={(event) => navigate({ role: event.target.value, page: "" })}
            className="h-9 w-full cursor-pointer rounded-lg border border-border bg-surface px-3 text-sm text-ink"
          >
            {ROLE_FILTERS.map((filter) => (
              <option key={filter.value || "all"} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className={buttonClassName("secondary", "md", "mb-0.5 sm:w-auto")}
        >
          Apply
        </button>
        {filtered ? (
          <button
            type="button"
            onClick={() => navigate({ status: "", role: "", search: "", page: "" })}
            className="mb-0.5 inline-flex h-9 items-center px-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </form>

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title={filtered ? "No matching users" : "No users yet"}
          description={filtered ? "Try different filters." : "Registered accounts will appear here."}
          action={
            filtered ? (
              <button
                type="button"
                onClick={() => navigate({ status: "", role: "", search: "", page: "" })}
                className={buttonClassName()}
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {data.pagination.total} user{data.pagination.total === 1 ? "" : "s"}
          </p>

          <Table headers={["User", "Role", "Status", "Joined", "Actions"]} caption="Users">
            {users.map((u) => {
              const isSelf = me && u.id === me.id;
              const isAdmin = u.role === "ADMIN";
              const canPromote = !isAdmin && !atLimit && !isSelf;
              const canDemote = isAdmin && !lastAdmin && !isSelf;
              return (
                <tr key={u.id} className="transition-colors hover:bg-background">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {u.firstName} {u.lastName}
                      {isSelf ? <span className="ml-2 text-xs text-muted">(you)</span> : null}
                    </p>
                    <p className="text-xs text-muted">{u.email}</p>
                    {u.phone ? <p className="text-xs text-muted">{u.phone}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDateTime(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openStatus(u)}
                        disabled={isAdmin}
                        title={isAdmin ? "Administrator accounts cannot be deactivated" : undefined}
                        className="text-sm font-medium text-primary transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:text-muted"
                      >
                        Status
                      </button>
                      {canPromote ? (
                        <button
                          type="button"
                          onClick={() => setRoleFor({ user: u, nextRole: "ADMIN" })}
                          className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                        >
                          Make admin
                        </button>
                      ) : null}
                      {canDemote ? (
                        <button
                          type="button"
                          onClick={() => setRoleFor({ user: u, nextRole: "CUSTOMER" })}
                          className="text-sm font-medium text-error transition-colors hover:text-error/80"
                        >
                          Remove admin
                        </button>
                      ) : null}
                      {isAdmin && atLimit && !isSelf ? (
                        <span className="text-xs text-muted">Admin limit reached</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>

          <Pagination
            basePath="/admin/users"
            current={current}
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
          />
        </>
      )}

      {/* --- Status change --- */}
      <Modal
        open={Boolean(statusFor)}
        onClose={() => setStatusFor(null)}
        title="Change account status"
        description={
          statusFor ? `Choose a status for ${statusFor.firstName} ${statusFor.lastName}.` : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusFor(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={applyStatus} loading={submitting} disabled={statusFor?.status === statusChoice}>
              Save status
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="Account status">
          {ACCOUNT_STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatusChoice(option)}
              aria-pressed={statusChoice === option}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusChoice === option
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-muted hover:border-primary/40 hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Suspended and inactive accounts cannot sign in. Administrators cannot be deactivated.
        </p>
      </Modal>

      {/* --- Role change --- */}
      <Modal
        open={Boolean(roleFor)}
        onClose={() => setRoleFor(null)}
        title={roleFor?.nextRole === "ADMIN" ? "Promote to administrator?" : "Remove administrator?"}
        description={
          roleFor
            ? roleFor.nextRole === "ADMIN"
              ? `${roleFor.user.firstName} ${roleFor.user.lastName} will get full admin console access.`
              : `${roleFor.user.firstName} ${roleFor.user.lastName} will become a customer account.`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setRoleFor(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={roleFor?.nextRole === "ADMIN" ? "primary" : "danger"}
              onClick={applyRole}
              loading={submitting}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {stats ? `Administrators: ${stats.count} / ${stats.limit} used.` : ""}
          {roleFor?.nextRole === "ADMIN" && atLimit
            ? " The maximum has been reached."
            : " Changes take effect on the next request."}
        </p>
      </Modal>
    </div>
  );
}