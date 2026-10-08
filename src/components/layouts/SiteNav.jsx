"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname, href) {
  if (href === "/categories") return pathname === href || pathname.startsWith("/categories/");
  if (href === "/shop") return pathname.startsWith("/shop") || pathname.startsWith("/products/");
  return pathname === href;
}

/** Centre navigation links with active state (desktop + mobile drawer). */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-primary-soft text-primary" : "text-muted hover:bg-background hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

/** Compact search box that jumps to /shop?q=… on submit. */
export function HeaderSearch() {
  const router = useRouter();
  const [text, setText] = useState("");

  function onSubmit(event) {
    event.preventDefault();
    const q = text.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    setText("");
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="relative hidden w-full items-center md:flex md:w-44 lg:w-56"
    >
      <label htmlFor="header-search" className="sr-only">
        Search products
      </label>
      <span className="pointer-events-none absolute left-3 text-muted" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
        </svg>
      </span>
      <input
        id="header-search"
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search clothing…"
        autoComplete="off"
        className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-primary focus:bg-surface"
      />
    </form>
  );
}

/* Shared loader — the header renders this button twice (desktop + mobile
   drawer), so concurrent refreshes share one in-flight request. */
let countRequest = null;
function fetchCartCount() {
  if (!countRequest) {
    countRequest = api
      .get("/cart")
      .then((data) => data.cart?.itemCount ?? 0)
      .catch(() => null)
      .finally(() => {
        countRequest = null;
      });
  }
  return countRequest;
}

/** Cart link with a live item count for signed-in shoppers. */
export function CartButton() {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let alive = true;
    const load = () =>
      fetchCartCount().then((value) => {
        if (alive) setCount(value);
      });
    load();
    const onUpdate = () => load();
    window.addEventListener("cart:updated", onUpdate);
    return () => {
      alive = false;
      window.removeEventListener("cart:updated", onUpdate);
    };
  }, [isAuthenticated]);

  // Stale counts are hidden (not cleared) when signed out.
  const shownCount = isAuthenticated ? count : null;

  return (
    <Link
      href="/cart"
      aria-label={shownCount ? `Cart, ${shownCount} items` : "Cart"}
      className="relative rounded-lg p-2 text-ink transition-colors hover:bg-background"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="size-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.55h7.5a2 2 0 0 0 1.95-1.57L20.5 7H6m2.5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        />
      </svg>
      {shownCount ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
          {shownCount > 99 ? "99+" : shownCount}
        </span>
      ) : null}
    </Link>
  );
}

function InitialsAvatar({ user }) {
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
    >
      {initials}
    </span>
  );
}

/**
 * Right-side actions, auth-aware (public pages only — no admin/rider
 * controls beyond a dashboard link):
 *   visitor  — Search · Cart · Sign in · Register
 *   customer — Search · Cart · Orders · avatar · Sign out
 *   rider    — Search · Cart · Dashboard · avatar · Sign out
 *   admin    — Search · Cart · Dashboard · avatar · Sign out
 */
export function NavActions() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className="h-8 w-24 animate-pulse rounded-lg bg-border"
        title="Loading account"
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <HeaderSearch />
        <CartButton />
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-ink"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
        >
          Register
        </Link>
      </>
    );
  }

  const roleHome =
    user.role === "ADMIN" ? "/admin" : user.role === "RIDER" ? "/rider" : "/customer";
  const dashboardLabel = user.role === "ADMIN" ? "Dashboard" : user.role === "RIDER" ? "Rider app" : null;

  return (
    <>
      <HeaderSearch />
      <CartButton />
      {user.role === "CUSTOMER" ? (
        <Link
          href="/customer/orders"
          className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-ink lg:inline-flex"
        >
          Orders
        </Link>
      ) : null}
      {dashboardLabel ? (
        <Link
          href={roleHome}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-ink"
        >
          {dashboardLabel}
        </Link>
      ) : null}
      <Link
        href={roleHome}
        aria-label={dashboardLabel ? "Account" : "Account and orders"}
        className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-background"
      >
        <InitialsAvatar user={user} />
        <span className="hidden max-w-24 truncate text-sm font-medium text-ink lg:inline">
          {user.firstName}
        </span>
      </Link>
      <button
        type="button"
        onClick={logout}
        className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-error"
      >
        Sign out
      </button>
    </>
  );
}
