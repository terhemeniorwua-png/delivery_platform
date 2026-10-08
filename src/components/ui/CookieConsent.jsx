"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "skc.consent";

function readConsent() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("skc:consent", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("skc:consent", callback);
  };
}

function getSnapshot() {
  return readConsent();
}

/** SSR/initial hydration snapshot — the banner fades in after mount. */
function getServerSnapshot() {
  return null;
}

/**
 * SKYClothe cookie-consent banner.
 *
 * Asks once on the first visit and persists the choice in localStorage —
 * it never touches the JWT / `cdp.token` auth storage or any cookies, and it
 * makes no network calls. Escape dismisses the banner for the current page
 * without recording a decision (it reappears next visit).
 */
export default function CookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (consent !== null || dismissed) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setDismissed(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [consent, dismissed]);

  if (consent !== null || dismissed) return null;

  function choose(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage unavailable (private mode) — decision is per-session only */
    }
    window.dispatchEvent(new Event("skc:consent"));
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[55] flex justify-center px-4 pb-4 sm:pb-6"
    >
      <div className="animate-slide-up w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-ink/15 sm:p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5">
              <circle cx="12" cy="12" r="8.5" />
              <circle cx="9" cy="10" r="0.5" fill="currentColor" />
              <circle cx="13.5" cy="13.5" r="0.5" fill="currentColor" />
              <circle cx="15" cy="9" r="0.5" fill="currentColor" />
              <circle cx="9.5" cy="15.5" r="0.5" fill="currentColor" />
            </svg>
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">We use cookies</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              We use cookies to keep SKYClothe working properly and improve
              your experience. Your sign-in and session data are never
              affected by your choice here.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => choose("declined")}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-background"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Accept Cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}