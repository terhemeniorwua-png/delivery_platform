import Link from "next/link";

/**
 * Consistent section heading for the home page:
 * small eyebrow + title + description + optional "view all" action.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div className={`mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8 ${className}`}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-muted sm:text-base">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          {action.label} <span aria-hidden="true">&rarr;</span>
        </Link>
      ) : null}
    </div>
  );
}
