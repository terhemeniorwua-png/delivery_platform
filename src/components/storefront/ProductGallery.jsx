"use client";

import { useState } from "react";
import Image from "next/image";
import { productImages } from "@/lib/catalog";

/**
 * Clothing product gallery: large main image + thumbnail strip.
 * Client component (image switching). Falls back to a tinted panel with the
 * product name when the catalogue has no image yet.
 */
export default function ProductGallery({ product }) {
  const images = productImages(product);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-border bg-gradient-to-br from-background via-surface to-primary-soft p-6 text-center text-sm text-muted">
        {product.name}
        <span className="sr-only">No image available</span>
      </div>
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-background">
        <Image
          key={active.id}
          src={active.imageUrl}
          alt={`${product.name}${activeIndex > 0 ? ` — view ${activeIndex + 1}` : ""}`}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === activeIndex}
                className={`relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-colors ${
                  index === activeIndex
                    ? "border-primary"
                    : "border-border opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.imageUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
