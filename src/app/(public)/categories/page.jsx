import CategoryCard from "@/components/storefront/CategoryCard";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClassName } from "@/components/ui/Button";
import Link from "next/link";
import { fetchCategories, fetchProducts, primaryImage } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories",
  description:
    "Explore clothing categories — men, women, kids, shoes, accessories, traditional wear, sportswear and outerwear.",
};

export default async function CategoriesPage() {
  const [categories, { products }] = await Promise.all([
    fetchCategories(),
    fetchProducts({ limit: 100, sort: "newest" }),
  ]);

  const covers = new Map();
  for (const product of products) {
    const slug = product.category?.slug;
    const image = primaryImage(product);
    if (slug && image && !covers.has(slug)) covers.set(slug, image.imageUrl);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Categories
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Every corner of the wardrobe, organised. Pick a category to see what
          is in stock right now.
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              cover={covers.get(category.slug) ?? null}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No categories yet"
            description="Categories will appear here once the catalogue is set up."
            action={
              <Link href="/shop" className={buttonClassName()}>
                Browse all products
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
