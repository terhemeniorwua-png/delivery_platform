"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Button, { buttonClassName } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatPrice, discountPercent } from "@/lib/format";
import { hasDiscount, variantAxes, stockStatus, stockBadge, totalStock } from "@/lib/catalog";

const MAX_QTY = 10;

/**
 * Variant (size + colour) selection, quantity and add-to-cart action.
 * Uses the real cart API (POST /api/cart/items) for signed-in users — the
 * cart workflow itself (quantity editing, checkout) arrives in a later phase.
 */
export default function ProductPurchase({ product }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { sizes, colors } = useMemo(() => variantAxes(product.variants), [product.variants]);
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : "");
  const [color, setColor] = useState(colors.length === 1 ? colors[0] : "");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const status = stockStatus(product);
  const badge = stockBadge(product);
  const discounted = hasDiscount(product);
  const percent = discounted ? discountPercent(product.price, product.discountPrice) : null;
  const unitsInStock = totalStock(product);

  const selectedVariant =
    size && color ? product.variants.find((v) => v.size === size && v.color === color) : null;
  const variantStock = selectedVariant ? selectedVariant.stockQuantity : 0;

  // Effective unit price mirrors backend effectivePrice(): variant price wins,
  // then product discount, then base price.
  const unitPrice =
    selectedVariant && selectedVariant.price !== null && selectedVariant.price !== undefined
      ? Number(selectedVariant.price)
      : discounted
        ? Number(product.discountPrice)
        : Number(product.price);

  function availableFor(axis, value) {
    const other = axis === "size" ? color : size;
    return product.variants.some(
      (v) =>
        (axis === "size" ? v.size === value : v.color === value) &&
        (!other || (axis === "size" ? v.color === other : v.size === other)) &&
        v.stockQuantity > 0
    );
  }

  const needsSelection = !size || !color;
  const selectedOutOfStock = Boolean(selectedVariant && variantStock === 0);
  const maxQty = Math.min(MAX_QTY, Math.max(1, variantStock || unitsInStock || 1));
  const canAdd = !needsSelection && !selectedOutOfStock && status !== "OUT_OF_STOCK";

  async function addToCart() {
    if (!canAdd || !selectedVariant) return;
    setAdding(true);
    try {
      await api.post("/cart/items", {
        productVariantId: selectedVariant.id,
        quantity,
      });
      window.dispatchEvent(new Event("cart:updated"));
      toast(`Added ${product.name} (${size} / ${color}) to your cart`, { type: "success" });
    } catch (error) {
      toast(getApiErrorMessage(error), { type: "error" });
    } finally {
      setAdding(false);
    }
  }

  const chipBase =
    "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors";

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------------------- price */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`text-3xl font-semibold ${discounted ? "text-primary" : "text-ink"}`}>
          {formatPrice(unitPrice)}
        </span>
        {discounted ? (
          <>
            <span className="text-base text-muted line-through">
              {formatPrice(product.price)}
            </span>
            <Badge tone="danger">Save {percent}%</Badge>
          </>
        ) : null}
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      {/* ------------------------------------------------------------ size */}
      {sizes.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">
            Size {size ? <span className="font-normal text-muted">— {size}</span> : null}
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((value) => {
              const disabled = !availableFor("size", value);
              const active = size === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSize(active ? "" : value)}
                  disabled={disabled}
                  aria-pressed={active}
                  title={disabled ? "Out of stock in this combination" : undefined}
                  className={`${chipBase} min-w-11 ${
                    active
                      ? "border-primary bg-primary text-white"
                      : disabled
                        ? "cursor-not-allowed border-border bg-background text-muted/50 line-through"
                        : "border-border bg-surface text-ink hover:border-primary/50"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {/* ----------------------------------------------------------- color */}
      {colors.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">
            Colour {color ? <span className="font-normal text-muted">— {color}</span> : null}
          </legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((value) => {
              const disabled = !availableFor("color", value);
              const active = color === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(active ? "" : value)}
                  disabled={disabled}
                  aria-pressed={active}
                  title={disabled ? "Out of stock in this combination" : undefined}
                  className={`${chipBase} ${
                    active
                      ? "border-primary bg-primary text-white"
                      : disabled
                        ? "cursor-not-allowed border-border bg-background text-muted/50 line-through"
                        : "border-border bg-surface text-ink hover:border-primary/50"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {/* -------------------------------------------------------- selected */}
      {needsSelection ? (
        <p className="text-sm text-muted">
          Select {sizes.length ? "a size" : ""}
          {sizes.length && colors.length ? " and " : ""}
          {colors.length ? "a colour" : ""} to continue.
        </p>
      ) : selectedOutOfStock ? (
        <p role="status" className="text-sm font-medium text-error">
          {size} / {color} is out of stock. Try another combination.
        </p>
      ) : (
        <p role="status" className="text-sm text-muted">
          <span className="font-medium text-ink">
            {size} / {color}
          </span>{" "}
          — {variantStock} in stock
          {selectedVariant?.sku ? (
            <span className="block text-xs text-muted/80">SKU {selectedVariant.sku}</span>
          ) : null}
        </p>
      )}

      {/* -------------------------------------------------------- quantity */}
      <div className="flex items-center gap-4">
        <div>
          <span id="qty-label" className="mb-1.5 block text-sm font-medium text-ink">
            Quantity
          </span>
          <div className="inline-flex h-10 items-center rounded-lg border border-border bg-surface">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="h-full w-10 rounded-l-lg text-lg text-ink transition-colors hover:bg-background disabled:opacity-40"
            >
              &minus;
            </button>
            <span
              aria-live="polite"
              className="w-10 text-center text-sm font-medium text-ink"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              aria-label="Increase quantity"
              className="h-full w-10 rounded-r-lg text-lg text-ink transition-colors hover:bg-background disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {unitsInStock > 0 && unitsInStock <= 10 ? (
          <p className="self-end pb-2 text-sm font-medium text-warning">
            Only {unitsInStock} left in the catalogue
          </p>
        ) : null}
      </div>

      {/* ------------------------------------------------------------- cta */}
      {isAuthenticated ? (
        <Button size="lg" fullWidth onClick={addToCart} loading={adding} disabled={!canAdd}>
          {selectedOutOfStock || status === "OUT_OF_STOCK"
            ? "Out of stock"
            : needsSelection
              ? "Select size and colour"
              : "Add to cart"}
        </Button>
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`}
          className={buttonClassName("primary", "lg", "w-full")}
        >
          Sign in to add to cart
        </Link>
      )}

      <p className="text-xs text-muted">
        Delivered by our riders &middot; cash, card and transfer accepted.
      </p>
    </div>
  );
}
