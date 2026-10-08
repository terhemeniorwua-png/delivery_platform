import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductPurchase from "@/components/storefront/ProductPurchase";
import ProductGridWithItems from "@/components/storefront/ProductGrid";
import SectionHeading from "@/components/storefront/SectionHeading";
import { fetchProduct, fetchProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// Deduplicate the product fetch between generateMetadata and the page.
const getProduct = cache(fetchProduct);

async function loadProduct(idOrSlug) {
  try {
    return await getProduct(idOrSlug);
  } catch (error) {
    if (error?.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const product = await loadProduct(id);
    const brand = product.brand ? `${product.brand} — ` : "";
    return {
      title: product.name,
      description: `${brand}${product.description?.slice(0, 150) ?? "Shop this piece with doorstep delivery."}`,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await loadProduct(id);

  // "More in {category}" — same real API, excluding the current product.
  let related = [];
  if (product.category) {
    try {
      const result = await fetchProducts({ category: product.category.slug, limit: 12 });
      related = result.products.filter((item) => item.id !== product.id).slice(0, 4);
    } catch {
      related = [];
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="transition-colors hover:text-primary">
              Shop
            </Link>
          </li>
          {product.category ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="transition-colors hover:text-primary"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="max-w-48 truncate font-medium text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery product={product} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {product.category?.name ?? "Clothing"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {product.brand ? <span className="font-medium text-ink">{product.brand}</span> : null}
            {product.brand && product.sku ? " · " : null}
            {product.sku ? <span>SKU: {product.sku}</span> : null}
          </p>

          <div className="mt-6">
            <ProductPurchase product={product} />
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-ink">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-14 sm:mt-16">
          <SectionHeading
            eyebrow="Keep browsing"
            title={`More in ${product.category.name}`}
            action={{ href: `/categories/${product.category.slug}`, label: "View category" }}
          />
          <ProductGridWithItems products={related} />
        </section>
      ) : null}
    </div>
  );
}
