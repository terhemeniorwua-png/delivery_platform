"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { CenteredSpinner } from "@/components/ui/Spinner";
import StatCard from "@/components/dashboard/StatCard";
import Table from "@/components/admin/Table";
import { formatPrice } from "@/lib/format";
import {
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
  paymentMethodLabel,
  formatDateTime,
} from "@/lib/orders";
import {
  deliveryStatusLabel,
  deliveryStatusTone,
} from "@/lib/delivery";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Section({ title, action, children }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/dashboard")
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

  if (error) {
    return (
      <ErrorState
        title="Unable to load dashboard statistics"
        message={getApiErrorMessage(error)}
        onRetry={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  if (!data) return <CenteredSpinner label="Loading dashboard" />;

  const stats = data.stats;
  const admins = data.administrators;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {greeting()}, {user?.firstName ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s what&apos;s happening with your clothing delivery platform today.
        </p>
      </section>

      {/* --- Key statistics (aggregated on the backend) --- */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total customers" value={stats.totalCustomers} />
        <StatCard label="Total riders" value={stats.totalRiders} tone="success" />
        <StatCard
          label="Pending rider applications"
          value={stats.pendingApplications}
          tone="warning"
          hint={stats.pendingApplications > 0 ? "Awaiting review" : "All caught up"}
        />
        <StatCard label="Total products" value={stats.totalProducts} tone="neutral" />
        <StatCard label="Total orders" value={stats.totalOrders} />
        <StatCard
          label="Pending orders"
          value={stats.pendingOrders}
          tone={stats.pendingOrders > 0 ? "warning" : "neutral"}
        />
        <StatCard label="Active deliveries" value={stats.activeDeliveries} tone="primary" />
        <StatCard label="Completed deliveries" value={stats.completedDeliveries} tone="success" />
        <StatCard label="Total revenue" value={formatPrice(stats.totalRevenue)} tone="success" />
      </section>

      {/* --- Administrator capacity (11.5) --- */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Administrators</h2>
            <p className="mt-1 text-sm text-muted">
              {admins.atLimit
                ? "Maximum administrator capacity reached"
                : `${admins.remaining} administrator slot${admins.remaining === 1 ? "" : "s"} available`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tracking-tight text-ink">
              {admins.count} <span className="text-muted">/ {admins.limit}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className={`h-full rounded-full transition-all ${admins.atLimit ? "bg-error" : "bg-primary"}`}
            style={{ width: `${Math.min(100, (admins.count / admins.limit) * 100)}%` }}
            role="progressbar"
            aria-valuenow={admins.count}
            aria-valuemin={0}
            aria-valuemax={admins.limit}
            aria-label="Administrator capacity"
          />
        </div>
        <div className="mt-4">
          <Link href="/admin/administrators" className={buttonClassName("secondary", "sm")}>
            Manage administrators
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* --- Recent orders (11.6) --- */}
        <Section
          title="Recent orders"
          action={<span className="text-sm text-muted">{stats.totalOrders} total</span>}
        >
          {(data.recentOrders ?? []).length === 0 ? (
            <EmptyState title="No orders yet" description="Orders will appear here as customers check out." />
          ) : (
            <Table headers={["Order", "Customer", "Amount", "Payment", "Status"]} caption="Recent orders">
              {data.recentOrders.map((order) => {
                const payment = order.payments?.[0];
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-ink">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-muted">
                      {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {payment ? (
                        <Badge tone={paymentStatusTone(payment.status)}>
                          {paymentMethodLabel(payment.method)} · {paymentStatusLabel(payment.status)}
                        </Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Section>

        {/* --- Active deliveries (11.8) --- */}
        <Section title="Active deliveries">
          {(data.activeDeliveries ?? []).length === 0 ? (
            <EmptyState title="No active deliveries" description="Assigned deliveries show up here in real time." />
          ) : (
            <Table headers={["Order", "Rider", "Customer", "Status"]} caption="Active deliveries">
              {data.activeDeliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="px-4 py-3 font-medium text-ink">{delivery.order?.orderNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {delivery.rider?.user
                      ? `${delivery.rider.user.firstName} ${delivery.rider.user.lastName}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {delivery.order?.customer
                      ? `${delivery.order.customer.firstName} ${delivery.order.customer.lastName}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={deliveryStatusTone(delivery.status)}>
                      {deliveryStatusLabel(delivery.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      </div>

      {/* --- Recent rider applications (11.7) --- */}
      <Section
        title="Recent rider applications"
        action={
          <Link href="/admin/rider-applications" className="text-sm font-medium text-primary hover:text-primary-hover">
            Review all
          </Link>
        }
      >
        {(data.recentApplications ?? []).length === 0 ? (
          <EmptyState
            title="No rider applications"
            description="Applications from customers will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {data.recentApplications.map((application) => {
              const pending = application.status === "PENDING";
              return (
                <li key={application.id}>
                  <Link
                    href={`/admin/rider-applications/${application.id}`}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:border-primary/40 ${
                      pending ? "border-warning/40 bg-warning-soft" : "border-border bg-surface"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {application.fullName}
                        {application.user ? ` · ${application.user.email}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {application.phone} · {application.vehicleType} {application.vehicleNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Submitted {formatDateTime(application.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        tone={
                          application.status === "PENDING"
                            ? "warning"
                            : application.status === "APPROVED"
                              ? "success"
                              : "danger"
                        }
                      >
                        {application.status}
                      </Badge>
                      <span className="text-xs font-medium text-primary">
                        {pending ? "Review" : "View"} &rarr;
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}