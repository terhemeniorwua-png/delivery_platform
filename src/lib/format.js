/**
 * Formatting helpers for the storefront.
 *
 * Currency is configured in exactly ONE place (the backend has no currency
 * column — prices are plain numbers). Change CURRENCY here and every price
 * on the site updates.
 */
export const CURRENCY = {
  code: "NGN",
  symbol: "₦",
  locale: "en-NG",
};

const priceFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: "currency",
  currency: CURRENCY.code,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** formatPrice(28500) -> "₦28,500" */
export function formatPrice(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return CURRENCY.symbol;
  return priceFormatter.format(value);
}

/** Percent off between price and discountPrice, or null when no discount. */
export function discountPercent(price, discountPrice) {
  const original = Number(price);
  const discounted = Number(discountPrice);
  if (!original || !discounted || discounted >= original) return null;
  return Math.round(((original - discounted) / original) * 100);
}

/** "12 products" / "1 product" / "No products" */
export function productCountLabel(count) {
  if (!count) return "No products";
  return `${count} product${count === 1 ? "" : "s"}`;
}
