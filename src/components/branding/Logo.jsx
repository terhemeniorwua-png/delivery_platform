import Link from "next/link";

/**
 * SKYClothe branding.
 *
 * LogoMark — the SVG mark: a sky-gradient tile holding a minimalist
 * clothes-hanger glyph; the amber dot + fading trail echo the delivery
 * path ("Fashion. Delivered.").
 *
 * Logo      — mark + wordmark, ready for headers, footers, dashboards,
 *             auth screens and loading states. `onDark` flips the
 *             wordmark colours for use on dark surfaces.
 *
 * Server-safe (no hooks): every mark uses the same gradient definition, so
 * a fixed id is safe even with multiple instances on one page.
 */
export function LogoMark({ size = 32, className = "" }) {
  const gradId = "skygrad-mark";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      <rect x="1" y="1" width="46" height="46" rx="13" fill={`url(#${gradId})`} />

      {/* hanger: hook, stem, bar and arms */}
      <circle cx="24" cy="10.6" r="2.4" fill="#ffffff" />
      <path
        d="M24 13v10M15 23h18M17.75 23 24 36l6.25-13"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* delivery path: fading dots arriving at an amber marker */}
      <circle cx="19.5" cy="39.5" r="1.4" fill="#ffffff" opacity="0.45" />
      <circle cx="24" cy="41" r="1.7" fill="#ffffff" opacity="0.7" />
      <circle cx="28.5" cy="39" r="2.3" fill="#fbbf24" />
    </svg>
  );
}

export default function Logo({
  size = 32,
  onDark = false,
  href,
  className = "",
  textClassName = "",
}) {
  const wordmark = (
    <span
      className={`whitespace-nowrap text-[17px] font-bold leading-none tracking-tight ${
        onDark ? "text-white" : "text-ink"
      } ${textClassName}`}
    >
      SKY<span className={onDark ? "text-sky-brand" : "text-primary"}>Clothe</span>
    </span>
  );

  const inner = (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {wordmark}
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="SKYClothe — home" className={`inline-flex items-center ${className}`}>
        {inner}
      </Link>
    );
  }

  return <span className={`inline-flex items-center ${className}`}>{inner}</span>;
}