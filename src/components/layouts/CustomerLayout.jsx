"use client";

import { useEffect, useState } from "react";
import RoleGate from "@/components/auth/RoleGate";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h7V3H3v9Zm0 9h7v-6H3v6Zm11 0h7v-9h-7v9Zm0-18v6h7V3h-7Z" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.5 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0v.75H4.5v-.75Z" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l2.4 12.3a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9Z" />
    </svg>
  ),
  rider: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5.5a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16.5 11.5l2 2 3-3" />
    </svg>
  ),
};

/**
 * Customer area shell (app/(customer)/layout.jsx):
 *   <CustomerLayout>{children}</CustomerLayout>
 *
 * Guards the section (CUSTOMER role only) and derives the sidebar: the
 * rider entry adapts to the customer's application status, and a logout
 * action lives in the footer.
 */
export default function CustomerLayout({ children }) {
  const { isAuthenticated, logout } = useAuth();
  const [application, setApplication] = useState(undefined);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    api
      .get("/rider-applications/me")
      .then((data) => {
        if (!cancelled) setApplication(data.application ?? null);
      })
      .catch(() => {
        if (!cancelled) setApplication(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const riderStatus = application?.status;
  const navigation = [
    { href: "/customer", label: "Overview", icon: ICONS.overview },
    { href: "/customer/orders", label: "Orders", icon: ICONS.orders },
    { href: "/customer/profile", label: "Profile", icon: ICONS.profile },
    { href: "/cart", label: "Cart", icon: ICONS.cart },
    { href: "/shop", label: "Continue shopping", icon: ICONS.shop },
  ];
  if (riderStatus !== "APPROVED") {
    navigation.push({
      href: "/customer/become-rider",
      label: riderStatus ? "Rider application" : "Become a rider",
      icon: ICONS.rider,
    });
  }

  return (
    <RoleGate roles={["CUSTOMER"]}>
      <DashboardLayout
        brand="Clothing Delivery"
        title="My account"
        navigation={navigation}
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