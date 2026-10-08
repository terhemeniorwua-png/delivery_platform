"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Public site header: wordmark, pluggable navigation and action slots.
 * Collapses to a drawer-style menu on mobile.
 *
 * Later phases pass real links:
 *   <SiteHeader nav={<NavLinks />} actions={<AuthButtons />} />
 */
export default function SiteHeader({ nav = null, actions = null }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
          Clothing Delivery
        </Link>

        <div className="hidden items-center gap-1 md:flex">{nav}</div>

        <div className="hidden items-center gap-2 md:flex">{actions}</div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="rounded-lg p-2 text-ink transition-colors hover:bg-background md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          {nav ? <div className="flex flex-col gap-1">{nav}</div> : null}
          {actions ? (
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
