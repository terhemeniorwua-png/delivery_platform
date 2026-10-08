"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { ProductCardSkeletons } from "@/components/storefront/ProductGrid";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

/**
 * Cart view — READ-ONLY in this phase. Items come straight from the real
 * cart API (GET /api/cart); quantity editing, removal and checkout belong to
 * the dedicated cart/checkout phase.
 */
export default function CartPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <Link href="/login" className={buttonClassName()}>
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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Your cart</h1>
          <p className="mt-1 text-sm text-muted">
            {cart?.itemCount ?? 0} item{(cart?.itemCount ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
        <Badge tone="primary">Checkout arriving soon</Badge>
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Browse the catalogue and add a piece to see it here."
            action={
              <Link href="/shop" className={buttonClassName()}>
                Start shopping
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 p-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                  {item.product?.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${item.product?.slug ?? item.product?.id}`}
                      className="text-sm font-semibold text-ink transition-colors hover:text-primary"
                    >
                      {item.product?.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.variant ? `${item.variant.size} / ${item.variant.color}` : null}
                      {item.product?.brand ? ` · ${item.product.brand}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{formatPrice(item.lineTotal)}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col items-end gap-3">
            <div className="flex items-center gap-6 text-base">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-ink">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-muted">
              Delivery fees and checkout are added in the next phase.
            </p>
            <Link href="/shop" className={buttonClassName("secondary")}>
              Continue shopping
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
