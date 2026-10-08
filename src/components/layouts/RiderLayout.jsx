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
  deliveries: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3V7Zm11 2h4l3 3v3h-7V9ZM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    </svg>
  ),
  availability: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0v.75H4.5v-.75Z" />
    </svg>
  ),
};

/**
 * Rider area shell (app/(rider)/layout.jsx).
 * Guards the section (RIDER role only — approved riders), sidebar + logout.
 */
export default function RiderLayout({ children }) {
  const { user, logout } = useAuth();

  const navigation = [
    { href: "/rider", label: "Dashboard", icon: ICONS.dashboard },
    { href: "/rider/deliveries", label: "Deliveries", icon: ICONS.deliveries },
    { href: "/rider/availability", label: "Availability", icon: ICONS.availability },
    { href: "/rider/profile", label: "Profile", icon: ICONS.profile },
  ];

  return (
    <RoleGate roles={["RIDER"]}>
      <DashboardLayout
        title="Rider workspace"
        navigation={navigation}
        headerActions={
          user ? (
            <span className="hidden text-sm text-muted sm:inline">
              Signed in as <span className="font-medium text-ink">{user.firstName}</span>
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