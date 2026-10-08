"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/branding/Logo";

/**
 * Shared shell for ALL role areas (customer / rider / admin): sidebar
 * navigation + topbar + content. One implementation, three thin wrappers —
 * navigation never gets duplicated per dashboard (see CustomerLayout,
 * RiderLayout, AdminLayout).
 *
 * Responsive: sidebar is static on lg+, and a drawer on smaller screens.
 *
 * navigation: [{ href, label, icon? }]
 */
export default function DashboardLayout({
  title,
  navigation = [],
  headerActions = null,
  sidebarFooter = null,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href) =>
    href === pathname || pathname.startsWith(`${href}/`);

  const navList = (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-background hover:text-ink"
            }`}
          >
            {Icon ? <span className="shrink-0">{Icon}</span> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <>
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo href="/" size={30} textClassName="text-base" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">{navList}</div>
      {sidebarFooter ? (
        <div className="border-t border-border p-4">{sidebarFooter}</div>
      ) : null}
    </>
  );

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-ink/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="animate-slide-in-left absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-xl">
            {sidebarInner}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-ink transition-colors hover:bg-background lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {title ? (
            <h1 className="truncate text-base font-semibold text-ink">{title}</h1>
          ) : (
            <span />
          )}
          <div className="ml-auto flex items-center gap-2">{headerActions}</div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
