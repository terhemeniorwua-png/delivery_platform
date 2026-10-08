import { notFound } from "next/navigation";
import SearchField from "@/components/storefront/SearchField";
import ShopFilters from "@/components/storefront/ShopFilters";
import MobileFilters from "@/components/storefront/MobileFilters";
import SortSelect from "@/components/storefront/SortSelect";
import Pagination from "@/components/storefront/Pagination";
import ProductGridWithItems from "@/components/storefront/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClassName } from "@/components/ui/Button";
import Link from "next/link";
import { fetchProducts, fetchCategories } from "@/lib/catalog";
import { normalizeSearchParams } from "@/lib/url";
import { productCountLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop",
  description:
    "Browse the full clothing catalogue — search by name, brand or category, filter by price and sort to find your next outfit.",
};

export default async function ShopPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);

  const query = {
    page: Number(params.page) > 0 ? Number(params.page) : 1,
    limit: 12,
    sort: params.sort || "newest",
    search: params.q?.trim() || undefined,
    category: params.category || undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  };

  let result;
  let categories;
  try {
    [result, categories] = await Promise.all([fetchProducts(query), fetchCategories()]);
  } catch (error) {
    // A missing category (backend 404) is a real 404 page; anything else
    // bubbles to the route error boundary with a retry action.
    if (error?.status === 404) notFound();
    throw error;
  }

  const { products, pagination } = result;
  const filtersActive = Boolean(query.search || query.category || query.minPrice !== undefined || query.maxPrice !== undefined);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Shop</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {productCountLabel(pagination.total)}
            {query.search ? (
              <>
                {" "}
                for <span className="font-medium text-ink">&ldquo;{query.search}&rdquo;</span>
              </>
            ) : null}
          </p>
        </div>
        <SortSelect basePath="/shop" current={params} value={query.sort} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          basePath="/shop"
          current={params}
          value={query.search ?? ""}
          className="w-full sm:max-w-sm"
        />
        <MobileFilters basePath="/shop" current={params} categories={categories} />
      </div>

      <div className="mt-5 hidden border-b border-border pb-5 lg:block">
        <ShopFilters basePath="/shop" current={params} categories={categories} />
      </div>

      <div className="mt-8">
        {products.length > 0 ? (
          <>
            <ProductGridWithItems products={products} />
            <Pagination
              basePath="/shop"
              current={params}
              page={pagination.page}
              totalPages={pagination.totalPages}
            />
          </>
        ) : filtersActive ? (
          <EmptyState
            title="No products found"
            description={
              query.category
                ? "Nothing matches your filters in this category. Try another search or browse our categories."
                : "Try another search or browse our categories."
            }
            action={
              <Link href="/shop" className={buttonClassName()}>
                Browse all products
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="No products available"
            description="The catalogue is empty right now. Browse our categories in the meantime."
            action={
              <Link href="/categories" className={buttonClassName()}>
                Browse categories
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
