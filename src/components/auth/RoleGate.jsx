"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/ui/Spinner";

/**
 * Client-side route protection for future role-based areas:
 *
 *   <RoleGate roles={["ADMIN"]}> ...admin page... </RoleGate>
 *
 * - While the session hydrates, renders a centered spinner.
 * - Unauthenticated  -> redirect to `loginHref` (Phase 2 login page).
 * - Authenticated but wrong role -> redirect to that role's home via
 *   `homeByRole` (defaults: /customer, /rider, /admin — Phase 2 routes).
 *
 * Place it inside a route group layout (e.g. app/(admin)/layout.jsx) so
 * whole sections are protected with a single wrapper. Pages that do not
 * exist yet are configured in later phases.
 */
const DEFAULT_HOME_BY_ROLE = {
  CUSTOMER: "/customer",
  RIDER: "/rider",
  ADMIN: "/admin",
};

export default function RoleGate({
  roles,
  children,
  loginHref = "/login",
  homeByRole = DEFAULT_HOME_BY_ROLE,
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed =
    !roles || roles.length === 0 || (user && roles.includes(user.role));

  // Send users back where they were headed after signing in.
  const loginTarget = pathname
    ? `${loginHref}${loginHref.includes("?") ? "&" : "?"}next=${encodeURIComponent(pathname)}`
    : loginHref;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(loginTarget);
      return;
    }
    if (!allowed) {
      router.replace(homeByRole[user.role] ?? "/");
    }
  }, [loading, user, allowed, router, loginTarget, homeByRole]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Checking your session" />
      </div>
    );
  }

  // Redirects are handled in the effect above; render nothing meanwhile so
  // protected content never flashes for unauthorised users.
  if (!user || !allowed) return null;

  return children;
}
