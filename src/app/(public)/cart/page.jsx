"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { ProductCardSkeletons } from "@/components/storefront/ProductGrid";
import { buttonClassName } from "@/components/ui/Button";
import Button from "@/components/ui/Button";
import { formatPrice, checkoutTotals } from "@/lib/format";

const MAX_QTY = 100;

/**
 * Cart page — every value comes from the real cart API
 * (GET /api/cart, PATCH /api/cart/items/:id, DELETE /api/cart/items/:id).
 * The backend validates stock and availability; this UI mirrors those
 * responses and refreshes from the server after every mutation.
 */
export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [itemErrors, setItemErrors] = useState({});

  // Promise-chain so every setState lives in an async callback (safe to call
  // from the effect below — first paint relies on `loading: true`).
  const load = useCallback(
    () =>
      api
        .get("/cart")
        .then((data) => {
          setCart(data.cart);
          setError(null);
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    load();
  }, [authLoading, isAuthenticated, load]);

  function retry() {
    setLoading(true);
    setError(null);
    load();
  }

  function applyCart(nextCart) {
    setCart(nextCart);
    window.dispatchEvent(new Event("cart:updated"));
  }

  function changeQuantity(item, quantity) {
    if (busyId) return;
    const max = Math.min(MAX_QTY, Math.max(0, item.availableStock ?? MAX_QTY));
    if (quantity < 1 || quantity > max) return;
    setBusyId(item.id);
    setItemErrors((prev) => ({ ...prev, [item.id]: null }));
    api
      .patch(`/cart/items/${item.id}`, { quantity })
      .then((data) => applyCart(data.cart))
      .catch((err) => {
        const message = getApiErrorMessage(err);
        setItemErrors((prev) => ({ ...prev, [item.id]: message }));
        toast(message, { type: "error" });
        // Re-sync with the backend so the stepper shows the true quantity.
        return api.get("/cart").then((data) => setCart(data.cart));
      })
      .finally(() => setBusyId(null));
  }

  function removeItem(item) {
    if (busyId) return;
    setBusyId(item.id);
    setItemErrors((prev) => ({ ...prev, [item.id]: null }));
    api
      .delete(`/cart/items/${item.id}`)
      .then((data) => {
        applyCart(data.cart);
        toast(`Removed ${item.product?.name ?? "item"} from your cart`, { type: "success" });
      })
      .catch((err) => {
        const message = getApiErrorMessage(err);
        toast(message, { type: "error" });
        return api.get("/cart").then((data) => setCart(data.cart));
      })
      .finally(() => setBusyId(null));
  }

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <ProductCardSkeletons count={3} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Sign in to view your cart"
          description="Your cart follows your account — sign in to see the items you've added."
          action={
            <Link href="/login?next=%2Fcart" className={buttonClassName()}>
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  if (loading && !cart) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <ProductCardSkeletons count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState
          title="Unable to load your cart"
          message={getApiErrorMessage(error)}
          onRetry={retry}
        />
      </div>
    );
  }

  const items = cart?.items ?? [];
  const { subtotal, deliveryFee, total } = checkoutTotals(cart?.subtotal);

  // A line is blocked when the backend says it can't be ordered (product
  // removed / deactivated, or quantity above the current stock).
  const hasBlockedItems = items.some(
    (item) =>
      item.product?.status !== "ACTIVE" ||
      (item.availableStock ?? 0) < item.quantity
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Your cart is empty"
          description="Discover our latest clothing collection."
          action={
            <Link href="/shop" className={buttonClassName()}>
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Your cart</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/shop" className={buttonClassName("secondary", "sm")}>
          Continue shopping
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* ------------------------------------------------------- items */}
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {items.map((item) => {
            const inactive = item.product?.status !== "ACTIVE";
            const outOfStock = (item.availableStock ?? 0) === 0;
            const overStock = !outOfStock && (item.availableStock ?? 0) < item.quantity;
            const warning = inactive
              ? "This item is no longer available. Please remove it before continuing."
              : outOfStock
                ? "Out of stock — remove this item to continue."
                : overStock
                  ? `Only ${item.availableStock} left in stock — reduce the quantity or remove the item.`
                  : null;
            const warningTone = overStock ? "text-warning" : "text-error";
            const busy = busyId === item.id;
            const max = Math.min(MAX_QTY, Math.max(1, item.availableStock ?? MAX_QTY));

            return (
              <li key={item.id} className="gap-4 p-4 sm:flex sm:items-center">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                  {item.product?.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product?.name ?? "Product image"}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="mt-3 min-w-0 flex-1 sm:mt-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <Link
                      href={`/products/${item.product?.slug ?? item.product?.id}`}
                      className="text-sm font-semibold text-ink transition-colors hover:text-primary"
                    >
                      {item.product?.name}
                    </Link>
                    <p className="text-sm font-semibold text-ink">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-muted">
                    {item.variant ? `${item.variant.size} / ${item.variant.color}` : null}
                    {item.product?.brand ? ` · ${item.product.brand}` : ""}
                    {item.variant?.sku ? ` · ${item.variant.sku}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Unit price {formatPrice(item.unitPrice)}
                  </p>

                  {inactive ? (
                    <p role="alert" className="mt-2 text-xs font-medium text-error">
                      This item is no longer available. Please remove it before continuing.
                    </p>
                  ) : overStock ? (
                    <p role="alert" className="mt-2 text-xs font-medium text-warning">
                      Only {item.availableStock} left in stock — reduce the quantity or remove
                      the item.
                    </p>
                  ) : null}
                  {itemErrors[item.id] ? (
                    <p role="alert" className="mt-2 text-xs font-medium text-error">
                      {itemErrors[item.id]}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 sm:mt-0 sm:flex-col sm:items-end">
                  <div
                    className="inline-flex h-9 items-center rounded-lg border border-border bg-surface"
                    role="group"
                    aria-label={`Quantity for ${item.product?.name ?? "item"}`}
                  >
                    <button
                      type="button"
                      onClick={() => changeQuantity(item, item.quantity - 1)}
                      disabled={busy || item.quantity <= 1 || inactive}
                      aria-label="Decrease quantity"
                      className="h-full w-9 rounded-l-lg text-ink transition-colors hover:bg-background disabled:opacity-40"
                    >
                      &minus;
                    </button>
                    <span
                      aria-live="polite"
                      className={`w-9 text-center text-sm font-medium ${busy ? "text-muted" : "text-ink"}`}
                    >
                      {busy ? "…" : item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(item, item.quantity + 1)}
                      disabled={busy || item.quantity >= max || inactive}
                      aria-label="Increase quantity"
                      className="h-full w-9 rounded-r-lg text-ink transition-colors hover:bg-background disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    disabled={busy}
                    className="text-xs font-medium text-muted underline-offset-2 transition-colors hover:text-error hover:underline disabled:opacity-50"
                  >
                    {busy ? "Working…" : "Remove"}
                  </button>
                </div>

                {outOfStock && !inactive ? (
                  <div className="mt-3 sm:col-span-full">
                    <Badge tone="warning">Out of stock</Badge>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* ---------------------------------------------------- summary */}
        <aside className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Delivery fee</dt>
              <dd className="font-medium text-ink">{formatPrice(deliveryFee)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-semibold text-ink">{formatPrice(total)}</dd>
            </div>
          </dl>

          {hasBlockedItems ? (
            <p role="alert" className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
              Some items are unavailable or above stock. Adjust your cart to continue.
            </p>
          ) : null}

          <Button
            size="lg"
            fullWidth
            className="mt-5"
            disabled={hasBlockedItems}
            onClick={() => {
              window.location.assign("/checkout");
            }}
          >
            Proceed to checkout
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            Final delivery fee and totals are confirmed by the backend when your order is
            placed.
          </p>
        </aside>
      </div>
    </div>
  );
}
