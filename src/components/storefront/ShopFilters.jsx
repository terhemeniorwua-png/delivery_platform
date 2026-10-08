"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildQuery } from "@/lib/url";

/**
 * Shop filters: category pills (server-provided categories) + min/max price
 * (both supported by GET /api/products). Any change resets to page 1.
 */
export default function ShopFilters({ basePath = "/shop", current = {}, categories = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [minPrice, setMinPrice] = useState(current.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(current.maxPrice ?? "");

  const activeCategory = current.category || "";
  const hasPrice = Boolean(current.minPrice || current.maxPrice);
  const hasFilters = Boolean(activeCategory || hasPrice || current.q);

  function apply(changes) {
    startTransition(() => {
      router.replace(`${basePath}${buildQuery(current, { ...changes, page: 1 })}`, {
        scroll: false,
      });
    });
  }

  function applyPrice(event) {
    event.preventDefault();
    apply({ minPrice: String(minPrice).trim(), maxPrice: String(maxPrice).trim() });
  }

  function clearAll() {
    setMinPrice("");
    setMaxPrice("");
    startTransition(() => {
      router.replace(basePath, { scroll: false });
    });
  }

  const pillBase =
    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="sr-only">Filter by category</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => apply({ category: "" })}
            disabled={isPending}
            aria-pressed={!activeCategory}
            className={`${pillBase} ${
              !activeCategory
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-muted hover:border-primary/40 hover:text-ink"
            }`}
          >
            All
          </button>
          {categories.map((category) => {
            const active = activeCategory === category.slug;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => apply({ category: active ? "" : category.slug })}
                disabled={isPending}
                aria-pressed={active}
                className={`${pillBase} ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-muted hover:border-primary/40 hover:text-ink"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={applyPrice} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="min-price" className="mb-1 block text-xs font-medium text-muted">
            Min price (&#8358;)
          </label>
          <input
            id="min-price"
            type="number"
            min="0"
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="0"
            className="h-10 w-28 rounded-lg border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="max-price" className="mb-1 block text-xs font-medium text-muted">
            Max price (&#8358;)
          </label>
          <input
            id="max-price"
            type="number"
            min="0"
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="100,000"
            className="h-10 w-28 rounded-lg border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="h-10 rounded-lg border border-primary bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          Apply
        </button>

        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            disabled={isPending}
            className="h-10 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-ink"
          >
            Clear filters
          </button>
        ) : null}
      </form>
    </div>
  );
}
