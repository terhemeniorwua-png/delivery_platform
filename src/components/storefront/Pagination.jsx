"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildQuery } from "@/lib/url";

function pageWindow(page, totalPages) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

/** Prev / numbered pages / Next — all state lives in the URL. */
export default function Pagination({ basePath = "/shop", current = {}, page = 1, totalPages = 1 }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goTo(nextPage) {
    startTransition(() => {
      router.replace(
        `${basePath}${buildQuery(current, { page: nextPage <= 1 ? "" : nextPage })}`,
        { scroll: false }
      );
    });
  }

  const shared =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav aria-label="Product pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1 || isPending}
        className={`${shared} border-border bg-surface text-ink hover:bg-background`}
      >
        <span aria-hidden="true">&larr;</span>
        <span className="ml-1 hidden sm:inline">Prev</span>
      </button>

      {pageWindow(page, totalPages).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => goTo(value)}
          disabled={isPending}
          aria-current={value === page ? "page" : undefined}
          className={`${shared} ${
            value === page
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-ink hover:bg-background"
          }`}
        >
          {value}
        </button>
      ))}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages || isPending}
        className={`${shared} border-border bg-surface text-ink hover:bg-background`}
      >
        <span className="mr-1 hidden sm:inline">Next</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </nav>
  );
}
