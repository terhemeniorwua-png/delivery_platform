/** Shimmering placeholder block. Compose several for skeleton screens. */
export default function Skeleton({ className = "", style }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-border ${className}`}
      style={style}
    />
  );
}

/** Skeleton stand-in for a card list while data loads. */
export function SkeletonCards({ count = 6, className = "" }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-4">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
