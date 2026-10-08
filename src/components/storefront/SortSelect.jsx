"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildQuery } from "@/lib/url";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
];

/**
 * Sort select — writes `sort` into the URL and resets to page 1.
 * Only options the backend actually supports (product.validator.js).
 */
export default function SortSelect({ basePath = "/shop", current = {}, value = "newest" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(event) {
    const next = event.target.value;
    startTransition(() => {
      router.replace(
        `${basePath}${buildQuery(current, { sort: next === "newest" ? "" : next, page: 1 })}`,
        { scroll: false }
      );
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-products" className="text-sm text-muted">
        Sort
      </label>
      <select
        id="sort-products"
        value={value}
        onChange={onChange}
        disabled={isPending}
        className="h-10 cursor-pointer rounded-lg border border-border bg-surface px-3 text-sm text-ink transition-colors focus:border-primary disabled:opacity-60"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
