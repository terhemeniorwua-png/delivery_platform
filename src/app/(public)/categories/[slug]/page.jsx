import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import SortSelect from "@/components/storefront/SortSelect";
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
          </p>
        </div>
        <SortSelect basePath={`/categories/${slug}`} current={flat} value={query.sort} />
      </div>

      <div className="mt-8">
        {products.length > 0 ? (
          <>
            <ProductGridWithItems products={products} />
            <Pagination
              basePath={`/categories/${slug}`}
              current={flat}
              page={pagination.page}
              totalPages={pagination.totalPages}
            />
          </>
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
