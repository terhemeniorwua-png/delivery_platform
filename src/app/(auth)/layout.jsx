/**
 * Bare shell for auth pages (register) — intentionally no navbar or footer
 * so the forms stand alone. URL group: (auth).
 */
export default function AuthRouteLayout({ children }) {
  return <div className="min-h-full">{children}</div>;
}