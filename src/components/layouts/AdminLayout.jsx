"use client";

import RoleGate from "@/components/auth/RoleGate";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "@/context/AuthContext";

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h7V3H3v9Zm0 9h7v-6H3v6Zm11 0h7v-9h-7v9Zm0-18v6h7V3h-7Z" />
    </svg>
  ),
  riders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16.5 11.5l2 2 3-3" />
    </svg>
  ),
  applications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-5-5 5 5m-5-5v5h5" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" />
    </svg>
  ),
};

/**
 * Admin area shell (app/(admin)/layout.jsx).
 * Guards the section (ADMIN role only — never inferred from storage alone).
 */
export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();

  const navigation = [
    { href: "/admin", label: "Dashboard", icon: ICONS.dashboard },
    { href: "/admin/riders", label: "Riders", icon: ICONS.riders },
    { href: "/admin/rider-applications", label: "Rider applications", icon: ICONS.applications },
    { href: "/admin/users", label: "Users", icon: ICONS.users },
    { href: "/admin/administrators", label: "Administrators", icon: ICONS.admin },
  ];

  return (
    <RoleGate roles={["ADMIN"]}>
      <DashboardLayout
        title="Admin console"
        navigation={navigation}
        headerActions={
          user ? (
            <span className="hidden text-sm text-muted sm:inline">
              {user.firstName} · ADMIN
            </span>
          ) : null
        }
        sidebarFooter={
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-ink"
          >
            Log out
          </button>
        }
      >
        {children}
      </DashboardLayout>
    </RoleGate>
  );
}