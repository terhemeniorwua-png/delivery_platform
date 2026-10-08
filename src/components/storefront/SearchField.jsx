"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildQuery } from "@/lib/url";
import Spinner from "@/components/ui/Spinner";

/**
 * Debounced search box that writes `q` into the URL of `basePath`.
 * Loading feedback comes from the router transition (isPending).
 */
export default function SearchField({
  basePath = "/shop",
  current = {},
  value = "",
  placeholder = "Search clothing, brands…",
  autoFocus = false,
  className = "",
}) {
  const router = useRouter();
  const [text, setText] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const [isPending, startTransition] = useTransition();
  const firstRun = useRef(true);

  // Keep the box in sync when the URL changes elsewhere (back/forward, clear)
  // — render-phase adjustment instead of a setState-in-effect.
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const next = text.trim();
    if (next === (value || "").trim()) return;
    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(`${basePath}${buildQuery(current, { q: next, page: 1 })}`, {
          scroll: false,
        });
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [text, value, basePath, current, router]);

  function submitNow(event) {
    event.preventDefault();
    const next = text.trim();
    startTransition(() => {
      router.replace(`${basePath}${buildQuery(current, { q: next, page: 1 })}`, {
        scroll: false,
      });
    });
  }

  function clear() {
    setText("");
    startTransition(() => {
      router.replace(`${basePath}${buildQuery(current, { q: "", page: 1 })}`, {
        scroll: false,
      });
    });
  }

  return (
    <form
      role="search"
      onSubmit={submitNow}
      className={`relative flex w-full items-center ${className}`}
    >
      <label htmlFor="storefront-search" className="sr-only">
        Search products
      </label>
      <span className="pointer-events-none absolute left-3 text-muted" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
        </svg>
      </span>
      <input
        id="storefront-search"
        type="search"
        value={text}
        autoFocus={autoFocus}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-16 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-primary"
      />
      <span className="absolute right-2 flex items-center gap-1">
        {isPending ? <Spinner size="sm" label="Searching" className="text-muted" /> : null}
        {text && !isPending ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="rounded-md p-1 text-muted transition-colors hover:bg-background hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </span>
    </form>
  );
}
