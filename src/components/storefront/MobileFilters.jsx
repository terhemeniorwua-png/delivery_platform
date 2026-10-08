"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ShopFilters from "./ShopFilters";

/**
 * Mobile filter entry point: a [Filters] button that opens the same
 * ShopFilters used inline on lg+ (rendered inside a sheet, with its own
 * ID prefix to avoid duplicate element IDs).
 */
export default function MobileFilters({ basePath, current, categories = [] }) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    current.category,
    current.minPrice,
    current.maxPrice,
  ].filter(Boolean).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-primary/40 lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="size-4"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        Filters{activeCount ? ` (${activeCount})` : ""}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Filter products"
        description="Narrow the catalogue by category and price."
        footer={
          <Button fullWidth size="lg" onClick={() => setOpen(false)}>
            Show results
          </Button>
        }
      >
        <ShopFilters
          basePath={basePath}
          current={current}
          categories={categories}
          idPrefix="sheet-"
        />
      </Modal>
    </>
  );
}
