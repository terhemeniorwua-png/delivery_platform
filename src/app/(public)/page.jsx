import Hero from "@/components/storefront/Hero";
import SectionHeading from "@/components/storefront/SectionHeading";
import CategoryCard from "@/components/storefront/CategoryCard";
import ProductCard from "@/components/storefront/ProductCard";
import ProductGridWithItems from "@/components/storefront/ProductGrid";
import Marquee from "@/components/storefront/Marquee";
import PromoBanner from "@/components/storefront/PromoBanner";
import HowItWorks from "@/components/storefront/HowItWorks";
import WhyUs from "@/components/storefront/WhyUs";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClassName } from "@/components/ui/Button";
import Link from "next/link";
import { fetchCategories, fetchProducts, primaryImage } from "@/lib/catalog";

// Live catalogue data — rendered per request so admin changes show up
// immediately (and the build never needs a running backend).
export const dynamic = "force-dynamic";

export const metadata = {
  description:
    "Shop clothing for men, women and kids — everyday wear, traditional outfits, shoes and accessories, delivered to your doorstep by our riders.",
};

/** First product image per category slug (real API imagery for category cards). */
function coversByCategory(products) {
  const covers = new Map();
  for (const product of products) {
    const slug = product.category?.slug;
    const image = primaryImage(product);
    if (slug && image && !covers.has(slug)) covers.set(slug, image.imageUrl);
  }
  return covers;
}

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    fetchCategories(),
    fetchProducts({ limit: 100, sort: "newest" }),
  ]);

  const covers = coversByCategory(products);
  const featured = products.slice(0, 10);
  const promoProduct =
    products.find((product) => product.category?.slug === "traditional-wear" && primaryImage(product)) ??
    products.find((product) => primaryImage(product)) ??
    null;

  return (
    <>
      <Hero />

      <div className="space-y-14 py-12 sm:space-y-16 sm:py-16">
        {/* ------------------------------------------------- categories */}
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Shop by category"
            title="Collections for every wardrobe"
            description="From everyday basics to native outfits — find your category and start browsing."
            action={{ href: "/categories", label: "All categories" }}
          />

          {categories.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  cover={covers.get(category.slug) ?? null}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No categories yet"
              description="Categories will appear here once the catalogue is set up."
              action={
                <Link href="/shop" className={buttonClassName()}>
                  Browse all products
                </Link>
              }
            />
          )}
        </section>

        {/* --------------------------------------------------- featured */}
        {products.length > 0 ? (
          <section aria-labelledby="featured-heading" className="w-full">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
              <SectionHeading
                eyebrow="Featured"
                title="Featured pieces"
                description="Fresh arrivals and customer favourites — slowly scrolling past, straight from the live catalogue."
                action={{ href: "/shop", label: "View all" }}
              />
            </div>

            {featured.length >= 3 ? (
              /* Endless rail: cards drift across the screen, pause on hover. */
              <div className="mt-6">
                <Marquee>
                  {featured.map((product) => (
                    <div
                      key={product.id}
                      className="w-[260px] shrink-0 sm:w-[300px] [&>article]:h-full"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </Marquee>
              </div>
            ) : (
              <div className="mt-6">
                <ProductGridWithItems products={featured} />
              </div>
            )}
          </section>
        ) : (
          <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <EmptyState
              title="No products available"
              description="The catalogue is being stocked — check back shortly."
              action={
                <Link href="/categories" className={buttonClassName("secondary")}>
                  Explore categories
                </Link>
              }
            />
          </section>
        )}

        {/* ----------------------------------------------------- promo */}
        <PromoBanner
          product={promoProduct}
          href={promoProduct ? `/products/${promoProduct.slug}` : "/shop"}
          eyebrow="New Season Collection"
          title="Style, prepared and delivered."
          description="Discover the latest looks in our catalogue — packed with care and dropped off at your door by our riders."
          cta="Shop Collection"
        />

        <HowItWorks />
        <WhyUs />
      </div>
    </>
  );
}
