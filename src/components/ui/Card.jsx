const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 md:p-8",
};

export default function Card({
  as: Tag = "div",
  padding = "md",
  className = "",
  children,
  ...rest
}) {
  return (
    <Tag
      className={`rounded-xl border border-border bg-surface shadow-sm ${PADDING[padding] ?? PADDING.md} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Card with a header row (title + optional action) and a body. */
export function CardHeader({ title, description, action, className = "" }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
