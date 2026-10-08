/**
 * Catalogue access layer — thin wrappers over the Phase 1 API client for the
 * public product/category endpoints. Used by server components (home, shop,
 * category, product pages) so every page goes through the same client:
 *
 *   Frontend → api.js → REST API → Express → Sequelize → PostgreSQL
 *
 * Endpoints used (all exist in backend/src/routes):
 *   GET /categories              -> { categories: [...] with productCount }
 *   GET /categories/:idOrSlug    -> { category }
 *   GET /products                -> { products, pagination }
 *   GET /products/:idOrSlug      -> { product } (slug or UUID, + totalStock)
 */
import { api } from "@/lib/api";

/* ------------------------------------------------------------- fetchers -- */

export async function fetchCategories() {
  const data = await api.get("/categories");
  return data.categories ?? [];
}

export async function fetchCategory(idOrSlug) {
  const data = await api.get(`/categories/${encodeURIComponent(idOrSlug)}`);
  return data.category;
}

export async function fetchProducts(query = {}) {
  return api.get("/products", { query });
}

export async function fetchProduct(idOrSlug) {
  const data = await api.get(`/products/${encodeURIComponent(idOrSlug)}`);
  return data.product;
}

/* ---------------------------------------------------------- normalizers -- */

/** Images arrive primary-first from the API; guard anyway. */
export function productImages(product) {
  const images = product?.images ?? [];
  return [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

export function primaryImage(product) {
  return productImages(product)[0] ?? null;
}

/** Price actually shown to the customer. */
export function sellingPrice(product) {
  const discount = product?.discountPrice;
  return discount !== null && discount !== undefined ? Number(discount) : Number(product?.price);
}

export function hasDiscount(product) {
  return (
    product?.discountPrice !== null &&
    product?.discountPrice !== undefined &&
    Number(product.discountPrice) < Number(product.price)
  );
}

/** Sum of variant stock (list responses include variants). */
export function totalStock(product) {
  if (typeof product?.totalStock === "number") return product.totalStock;
  return (product?.variants ?? []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
}

export const STOCK_STATUS = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
};

export const LOW_STOCK_THRESHOLD = 5;

/** Availability derived from real variant stock — never from status alone. */
export function stockStatus(product) {
  const stock = totalStock(product);
  if (stock <= 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (stock <= LOW_STOCK_THRESHOLD) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
}

/** { label, tone } for the Badge component. */
export function stockBadge(product) {
  const stock = totalStock(product);
  switch (stockStatus(product)) {
    case STOCK_STATUS.OUT_OF_STOCK:
      return { label: "Out of stock", tone: "danger" };
    case STOCK_STATUS.LOW_STOCK:
      return { label: `Only ${stock} left`, tone: "warning" };
    default:
      return { label: "In stock", tone: "success" };
  }
}

/** Unique sizes/colors in a sensible order for the variant picker. */
export function variantAxes(variants) {
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
  const sizes = new Set();
  const colors = new Set();
  for (const v of variants ?? []) {
    if (v.size) sizes.add(v.size);
    if (v.color) colors.add(v.color);
  }
  const sortedSizes = [...sizes].sort((a, b) => {
    const ia = sizeOrder.indexOf(a.toUpperCase());
    const ib = sizeOrder.indexOf(b.toUpperCase());
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
  return { sizes: sortedSizes, colors: [...colors].sort() };
}
