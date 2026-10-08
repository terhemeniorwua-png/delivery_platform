import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import SortSelect from "@/components/storefront/SortSelect";
import SearchField from "@/components/storefront/SearchField";
import ShopFilters from "@/components/storefront/ShopFilters";
import MobileFilters from "@/components/storefront/MobileFilters";
import Pagination from "@/components/storefront/Pagination";
import ProductGridWithItems from "@/components/storefront/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClassName } from "@/components/ui/Button";
import { fetchCategory, fetchProducts } from "@/lib/catalog";
import { normalizeSearchParams } from "@/lib/url";
import { productCountLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

// Deduplicate the category fetch between generateMetadata and the page.
const getCategory = cache(fetchCategory);

async function loadData(slug, params) {
  let category;
  try {
    category = await getCategory(slug);
  } catch (error) {
    if (error?.status === 404) notFound();
    throw error;
  }

  const query = {
    page: Number(params.page) > 0 ? Number(params.page) : 1,
    limit: 12,
    sort: params.sort || "newest",
    category: slug,
    search: params.q?.trim() || undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  };

  try {
    const result = await fetchProducts(query);
    return { category, ...result, query };
  } catch (error) {
    if (error?.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  try {
    const category = await getCategory(slug);
    return {
      title: category.name,
      description:
        category.description ||
        `Shop ${category.name} — browse in-stock pieces and deliver them to your door.`,
    };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const flat = normalizeSearchParams(await searchParams);
  const { category, products, pagination, query } = await loadData(slug, flat);
  const filtersActive = Boolean(
    query.search || query.minPrice !== undefined || query.maxPrice !== undefined
  );
  const basePath = `/categories/${slug}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/categories" className="transition-colors hover:text-primary">
              Categories
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">
            {category.name}
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-6">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-2 text-sm text-muted sm:text-base">{category.description}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted" aria-live="polite">
            {productCountLabel(pagination.total)}
            {query.search ? (
              <>
                {" "}
                for <span className="font-medium text-ink">&ldquo;{query.search}&rdquo;</span>
              </>
            ) : null}
          </p>
        </div>
        <SortSelect basePath={basePath} current={flat} value={query.sort} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          basePath={basePath}
          current={flat}
          value={query.search ?? ""}
          className="w-full sm:max-w-sm"
        />
        <MobileFilters basePath={basePath} current={flat} categories={[]} />
      </div>

      <div className="mt-5 hidden border-b border-border pb-5 lg:block">
        <ShopFilters
          basePath={basePath}
          current={flat}
          categories={[]}
          showCategories={false}
        />
      </div>

      <div className="mt-8">
        {products.length > 0 ? (
          <>
            <ProductGridWithItems products={products} />
            <Pagination
              basePath={basePath}
              current={flat}
              page={pagination.page}
              totalPages={pagination.totalPages}
            />
          </>
        ) : filtersActive ? (
          <EmptyState
            title="No products match your filters"
            description="Try a different search or price range in this category."
            action={
              <Link href={basePath} className={buttonClassName()}>
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="No products in this category yet"
            description="Nothing is in stock here right now — browse the full catalogue instead."
            action={
              <Link href="/shop" className={buttonClassName()}>
                Browse all products
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
