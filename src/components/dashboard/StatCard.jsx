/** Compact statistic card used across the rider + admin dashboards. */
export default function StatCard({ label, value, hint, icon = null, tone = "primary" }) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-error-soft text-error",
    neutral: "bg-background text-muted",
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon ? (
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tones[tone] ?? tones.primary}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {value ?? "—"}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}