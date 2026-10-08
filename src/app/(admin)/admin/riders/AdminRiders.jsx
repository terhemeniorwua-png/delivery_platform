"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import Table from "@/components/admin/Table";
import { availabilityLabel, availabilityTone, vehicleLabel } from "@/lib/delivery";

function accountTone(status) {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "danger";
  return "warning";
}

export default function AdminRiders() {
  const [riders, setRiders] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/riders")
      .then((result) => {
        if (cancelled) return;
        setRiders(result.riders ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <ErrorState
        title="Unable to load riders"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  if (!riders) return <CenteredSpinner label="Loading riders" />;

  const term = query.trim().toLowerCase();
  const filtered = term
    ? riders.filter((rider) => {
        const user = rider.user ?? {};
        return [user.firstName, user.lastName, user.email, user.vehicleNumber]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
    : riders;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Riders</h1>
          <p className="mt-1 text-sm text-muted">
            {riders.length} rider{riders.length === 1 ? "" : "s"} on the platform.
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search);
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="w-full sm:w-56">
            <Input
              label="Search riders"
              type="search"
              name="search"
              placeholder="Name, email or vehicle"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                if (!event.target.value) setQuery("");
              }}
            />
          </div>
          <button
            type="submit"
            className="mb-0.5 inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-ink transition-colors hover:bg-background"
          >
            Search
          </button>
        </form>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={term ? "No matching riders" : "No riders yet"}
          description={
            term
              ? "Try a different name, email or vehicle number."
              : "Approved rider applications become riders here."
          }
          action={
            term ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setQuery("");
                }}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Clear search
              </button>
            ) : null
          }
        />
      ) : (
        <Table headers={["Rider", "Vehicle", "Availability", "Active", "Completed", "Account", ""]} caption="Riders">
          {filtered.map((rider) => {
            const user = rider.user ?? {};
            return (
              <tr key={rider.id} className="transition-colors hover:bg-background">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted">{user.email}</p>
                  {user.phone ? <p className="text-xs text-muted">{user.phone}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{vehicleLabel(rider.vehicleType)}</p>
                  <p className="text-xs text-muted">{rider.vehicleNumber}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={availabilityTone(rider.availability)}>
                    {availabilityLabel(rider.availability)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-ink">{rider.activeDeliveries}</td>
                <td className="px-4 py-3 text-ink">{rider.completedDeliveries}</td>
                <td className="px-4 py-3">
                  <Badge tone={accountTone(user.status)}>{user.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/riders/${rider.id}`}
                    className="text-sm font-medium text-primary hover:text-primary-hover"
                  >
                    View &rarr;
                  </Link>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}