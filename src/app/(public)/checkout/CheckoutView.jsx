"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Button, { buttonClassName } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { ProductCardSkeletons } from "@/components/storefront/ProductGrid";
import { formatPrice, checkoutTotals } from "@/lib/format";
import AddressForm from "./AddressForm";

/**
 * Checkout — delivery address (real /api/addresses), payment method
 * (CASH / CARD / TRANSFER) and an order summary from the real cart.
 *
 * Order creation sends ONLY { addressId }: the backend re-reads the cart,
 * re-validates stock and prices from PostgreSQL, computes totals, creates
 * the order and clears the cart inside one transaction. The chosen payment
 * method is then recorded via POST /api/payments (the backend finalises
 * CARD/TRANSFER and leaves CASH pending — no card details ever touch us).
 */
const PAYMENT_METHODS = [
  {
    id: "CASH",
    title: "Cash on delivery",
    description: "Pay the rider in cash when your order arrives.",
  },
  {
    id: "CARD",
    title: "Card",
    description: "Confirmed instantly — your order is confirmed right away.",
  },
  {
    id: "TRANSFER",
    title: "Bank transfer",
    description: "Confirmed instantly — pay by bank transfer.",
  },
];

export default function CheckoutView() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [cartError, setCartError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressError, setAddressError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [payment, setPayment] = useState("CASH");
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // allSettled: a failing address book degrades to an inline notice — the
  // cart (the critical half) still renders.
  const load = useCallback(() => {
    Promise.allSettled([api.get("/cart"), api.get("/addresses")]).then(
      ([cartResult, addressResult]) => {
        if (cartResult.status === "fulfilled") {
          setCart(cartResult.value.cart);
          setCartError(null);
        } else {
          setCartError(cartResult.reason);
        }
        if (addressResult.status === "fulfilled") {
          const list = addressResult.value.addresses ?? [];
          setAddresses(list);
          setAddressError(null);
          setSelectedId((current) => {
            if (current && list.some((address) => address.id === current)) return current;
            const preferred = list.find((address) => address.isDefault) ?? list[0];
            return preferred ? preferred.id : null;
          });
        } else {
          setAddressError("We could not load your saved addresses.");
        }
      }
    ).finally(() => setLoading(false));
  }, []);

  // Unauthenticated visitors are sent to login and brought straight back.
  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    router.replace("/login?next=%2Fcheckout");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    load();
  }, [authLoading, isAuthenticated, load]);

  function retry() {
    setLoading(true);
    setSubmitError(null);
    load();
  }

  function onAddressCreated(address) {
    setAddresses((prev) => [...prev, address]);
    setSelectedId(address.id);
    setAddressError(null);
    setAddOpen(false);
    toast("Address saved", { type: "success" });
  }

  async function placeOrder() {
    if (submitting) return;
    if (!selectedId) {
      setSubmitError("Select a delivery address to continue.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const data = await api.post("/orders", { addressId: selectedId });
      // Record the chosen method; a failure here is non-fatal (the order
      // exists) and the success screen reports the payment state honestly.
      try {
        await api.post("/payments", { orderId: data.order.id, method: payment });
      } catch {
        // Intentionally ignored — see SuccessView.
      }
      window.dispatchEvent(new Event("cart:updated"));
      router.push(`/checkout/success?order=${data.order.id}`);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
      setSubmitting(false);
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <ProductCardSkeletons count={2} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <ProductCardSkeletons count={2} />
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState
          title="Unable to load checkout"
          message={getApiErrorMessage(cartError)}
          onRetry={retry}
        />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Your cart is empty"
          description="Add something you love before checking out."
          action={
            <Link href="/shop" className={buttonClassName()}>
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  const { subtotal, deliveryFee, total } = checkoutTotals(cart.subtotal);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-muted">
        {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"} &middot; review your delivery
        details and confirm.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-8">
          {/* -------------------------------------------------- address */}
          <section
            aria-labelledby="checkout-address"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="checkout-address" className="text-base font-semibold text-ink">
                1 &middot; Delivery address
              </h2>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
              >
                + Add new address
              </button>
            </div>

            {addressError ? (
              <p role="alert" className="mt-4 rounded-lg bg-error-soft px-3 py-2 text-sm text-error">
                {addressError}
              </p>
            ) : null}

            {addresses.length === 0 && !addressError ? (
              <p className="mt-4 text-sm text-muted">
                No saved addresses yet — add one to tell the rider where to deliver.
              </p>
            ) : (
              <div className="mt-4 space-y-3" role="radiogroup" aria-label="Delivery address">
                {addresses.map((address) => {
                  const active = selectedId === address.id;
                  return (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                        active
                          ? "border-primary bg-primary-soft/60"
                          : "border-border bg-surface hover:border-primary/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-address"
                        checked={active}
                        onChange={() => setSelectedId(address.id)}
                        className="mt-1 size-4 shrink-0 border-border text-primary focus:ring-primary"
                      />
                      <span className="min-w-0 text-sm">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">
                            {address.recipientName}
                          </span>
                          {address.label ? (
                            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">
                              {address.label}
                            </span>
                          ) : null}
                          {address.isDefault ? (
                            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                              Default
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-muted">
                          {address.addressLine}, {address.city}, {address.state}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {address.phone}
                          {address.country ? ` · ${address.country}` : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {/* -------------------------------------------------- payment */}
          <section
            aria-labelledby="checkout-payment"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <h2 id="checkout-payment" className="text-base font-semibold text-ink">
              2 &middot; Payment method
            </h2>
            <div className="mt-4 space-y-3" role="radiogroup" aria-label="Payment method">
              {PAYMENT_METHODS.map((method) => {
                const active = payment === method.id;
                return (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                      active
                        ? "border-primary bg-primary-soft/60"
                        : "border-border bg-surface hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={active}
                      onChange={() => setPayment(method.id)}
                      className="mt-1 size-4 shrink-0 border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm">
                      <span className="font-semibold text-ink">{method.title}</span>
                      <span className="mt-0.5 block text-muted">{method.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              Card details are never collected on this site — payments are recorded through
              the platform&apos;s payment system.
            </p>
          </section>
        </div>

        {/* ---------------------------------------------------- summary */}
        <aside
          aria-labelledby="checkout-summary"
          className="rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-6"
        >
          <h2 id="checkout-summary" className="text-base font-semibold text-ink">
            3 &middot; Order summary
          </h2>

          <ul className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {item.product?.name}
                  </span>
                  <span className="text-xs text-muted">
                    {item.variant ? `${item.variant.size} / ${item.variant.color}` : null}
                    {" · Qty "}
                    {item.quantity}
                  </span>
                </span>
                <span className="shrink-0 font-medium text-ink">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery fee</dt>
              <dd className="font-medium text-ink">{formatPrice(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-semibold text-ink">{formatPrice(total)}</dd>
            </div>
          </dl>

          {submitError ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-error/30 bg-error-soft px-3 py-2 text-sm font-medium text-error"
            >
              {submitError}
            </p>
          ) : null}

          <Button
            size="lg"
            fullWidth
            className="mt-5"
            loading={submitting}
            disabled={!selectedId}
            onClick={placeOrder}
          >
            {submitting ? "Processing your order…" : "Place order"}
          </Button>
          <p className="mt-3 text-xs text-muted">
            Final stock, prices and totals are validated by the backend when you place the
            order.
          </p>
        </aside>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add delivery address"
        description="Where should the rider bring your order?"
        size="lg"
      >
        <AddressForm onCreated={onAddressCreated} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}
