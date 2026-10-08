"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import { buildQuery } from "@/lib/url";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import Pagination from "@/components/storefront/Pagination";
import Table from "@/components/admin/Table";
import { formatDateTime } from "@/lib/orders";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function statusTone(status) {
  if (status === "PENDING") return "warning";
  if (status === "APPROVED") return "success";
  return "danger";
}

export default function AdminApplications({ current = {} }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const page = Number(current.page) > 0 ? Number(current.page) : 1;
  const status = STATUS_FILTERS.some((f) => f.value === current.status) ? current.status : "";
  const search = current.search ?? "";

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const [searchDraft, setSearchDraft] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setSearchDraft(search);
  }

  const requestKey = `${page}|${status}|${search}`;

  useEffect(() => {
    let cancelled = false;
    api
      .get("/rider-applications", { query: { page, limit: PAGE_SIZE, status, search } })
      .then((result) => {
        if (cancelled) return;
        setData({ ...result, forKey: requestKey });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, search, requestKey, attempt]);

  function navigate(changes) {
    startTransition(() => {
      router.replace(`/admin/rider-applications${buildQuery(current, changes)}`, { scroll: false });
    });
  }

  const filtered = Boolean(status || search);
  const loading = (!data || data.forKey !== requestKey) && !error;

  if (error) {
    return (
      <ErrorState
        title="Unable to load rider applications"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Rider applications</h1>
        <p className="mt-1 text-sm text-muted">
          Review customer requests to join the delivery team.
        </p>
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
            label="Search applications"
            type="search"
            name="search"
            placeholder="Name, phone or vehicle"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            hint="Search by name, phone number or vehicle number."
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className={buttonClassName("secondary", "md", "mb-0.5 sm:w-auto")}
        >
          Search
        </button>
        {search ? (
          <button
            type="button"
            onClick={() => navigate({ search: "", page: "" })}
            className="mb-0.5 inline-flex h-9 items-center px-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map((filter) => {
          const active = filter.value === status;
          return (
            <button
              key={filter.value || "all"}
              type="button"
              disabled={isPending}
              aria-pressed={active}
              onClick={() => navigate({ status: filter.value, page: "" })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-muted hover:border-primary/40 hover:text-ink"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : (data?.applications ?? []).length === 0 ? (
        <EmptyState
          title={filtered ? "No matching applications" : "No rider applications yet"}
          description={
            filtered
              ? "Try a different status or search term."
              : "Customer applications to become a rider will appear here."
          }
          action={
            filtered ? (
              <button
                type="button"
                onClick={() => navigate({ status: "", search: "", page: "" })}
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
            {data.pagination.total} application{data.pagination.total === 1 ? "" : "s"}
          </p>

          <Table
            headers={["Applicant", "Phone", "Vehicle", "Status", "Submitted", "Reviewed", ""]}
            caption="Rider applications"
          >
            {data.applications.map((application) => (
              <tr key={application.id} className="transition-colors hover:bg-background">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{application.fullName}</p>
                  <p className="text-xs text-muted">{application.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-muted">{application.phone}</td>
                <td className="px-4 py-3">
                  <p className="text-ink">{application.vehicleType}</p>
                  <p className="text-xs text-muted">{application.vehicleNumber}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(application.status)}>{application.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted">{formatDateTime(application.createdAt)}</td>
                <td className="px-4 py-3 text-muted">
                  {application.reviewedAt ? formatDateTime(application.reviewedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/rider-applications/${application.id}`}
                    className="text-sm font-medium text-primary hover:text-primary-hover"
                  >
                    {application.status === "PENDING" ? "Review" : "View"} &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </Table>

          <Pagination
            basePath="/admin/rider-applications"
            current={current}
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
          />
        </>
      )}
    </div>
  );
}