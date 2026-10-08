import Spinner from "./Spinner";

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-surface border border-border text-ink hover:bg-background",
  outline: "border border-primary text-primary hover:bg-primary-soft",
  ghost: "text-muted hover:bg-background hover:text-ink",
  danger: "bg-error text-white hover:bg-error/90",
};

const SIZES = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60";

/**
 * Button classes for elements that must be links (`<Link className={...}>`)
 * so link-buttons look identical to <Button>.
 */
export function buttonClassName(variant = "primary", size = "md", className = "") {
  return `${BASE} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`;
}

/**
 * Standard action element. Presentational only — safe in client and server
 * components (handlers come from the parent).
 */
export default function Button({
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClassName(variant, size, fullWidth ? "w-full" : "")} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size="sm" label="" /> : null}
      {children}
    </button>
  );
}
