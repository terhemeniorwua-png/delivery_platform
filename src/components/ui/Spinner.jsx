const SIZES = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-10 border-3",
};

export default function Spinner({ size = "md", label = "Loading", className = "" }) {
  return (
    <span role="status" aria-label={label} className={`inline-flex items-center ${className}`}>
      <span
        className={`animate-spin rounded-full border-current border-t-transparent ${SIZES[size] ?? SIZES.md}`}
      />
    </span>
  );
}

/** Vertically + horizontally centred spinner for page/section loading. */
export function CenteredSpinner({ size = "lg", label = "Loading", className = "" }) {
  return (
    <div className={`flex min-h-[40vh] items-center justify-center text-muted ${className}`}>
      <Spinner size={size} label={label} />
    </div>
  );
}
