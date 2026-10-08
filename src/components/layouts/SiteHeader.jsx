"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Public site header: wordmark, pluggable navigation and action slots.
 * Collapses to a drawer-style menu on mobile.
 *
 * Slots:
 *   nav      — centre links (desktop; also shown inside the mobile drawer)
 *   actions  — right-side actions (desktop; also inside the drawer)
 *   trailing — always-visible mobile-only slot left of the menu button
 *              (used for the cart button: Logo / Cart / Menu on mobile)
 */
export default function SiteHeader({ nav = null, actions = null, trailing = null }) {
  // The drawer is "open for the pathname it was opened on" — changing route
  // closes it automatically, without an effect.
  const [openedFor, setOpenedFor] = useState(null);
  const pathname = usePathname();
  const menuOpen = openedFor === pathname;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg text-base font-semibold tracking-tight text-ink"
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white"
          >
            C
          </span>
          <span className="hidden sm:inline">Clothing Delivery</span>
          <span className="sm:hidden">Clothing</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">{nav}</div>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 sm:gap-2 md:flex">{actions}</div>
          <div className="flex items-center md:hidden">{trailing}</div>
          <button
            type="button"
            onClick={() => setOpenedFor(openedFor ? null : pathname)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-ink transition-colors hover:bg-background md:hidden"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          className="border-t border-border bg-surface px-4 py-3 md:hidden"
          onClick={(event) => {
            if (event.target.closest("a")) setOpenedFor(null);
          }}
        >
          <div className="mb-3">{actions ? <div className="flex flex-col gap-2">{actions}</div> : null}</div>
          {nav ? <div className="flex flex-col gap-1 border-t border-border pt-3">{nav}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
