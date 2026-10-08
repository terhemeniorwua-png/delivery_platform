import Link from "next/link";
import Image from "next/image";
import { buttonClassName } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { primaryImage, sellingPrice } from "@/lib/catalog";

/**
 * Storefront hero: clothing + doorstep-delivery message with a collage of
 * REAL product images passed in from the home page (API data, not stock
 * photos hardcoded here). Entrance animations are CSS-only and respect
 * prefers-reduced-motion (see globals.css).
 */
export default function Hero({ products = [] }) {
  const featured = products.filter((p) => primaryImage(p)).slice(0, 3);
  const [main, ...rest] = featured;

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-soft/70 via-transparent to-transparent" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center md:py-20 lg:gap-14 lg:py-24">
        <div className="max-w-xl">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-widest text-primary">
            Clothing, delivered
          </p>
          <h1 className="animate-fade-up animate-delay-1 mt-3 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            Fashion delivered to your doorstep.
          </h1>
          <p className="animate-fade-up animate-delay-2 mt-4 text-base text-muted sm:text-lg">
            Browse curated clothing for men, women and kids — place your order
            and a rider brings it straight to you.
          </p>

          <div className="animate-fade-up animate-delay-3 mt-7 flex flex-wrap gap-3">
            <Link href="/shop" className={buttonClassName("primary", "lg")}>
              Shop Now
            </Link>
            <Link href="/categories" className={buttonClassName("secondary", "lg")}>
              Explore Categories
            </Link>
          </div>
        </div>

        <div className="relative">
          {featured.length > 0 ? (
            <div className="animate-reveal animate-delay-2 grid grid-cols-2 gap-3 sm:gap-4">
              {main ? (
                <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-background sm:col-span-1 sm:row-span-2 sm:aspect-auto sm:h-full">
                  <Image
                    src={primaryImage(main).imageUrl}
                    alt={main.name}
                    fill
                    priority
                    sizes="(min-width: 768px) 30vw, 90vw"
                    className="object-cover"
                  />
                  <div className="absolute bottom-3 left-3 rounded-lg bg-surface/95 px-3 py-2 shadow-sm backdrop-blur">
                    <p className="text-xs font-medium text-ink">{main.name}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(sellingPrice(main))}
                    </p>
                  </div>
                </div>
              ) : null}

              {rest.map((product) => (
                <div
                  key={product.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-background"
                >
                  <Image
                    src={primaryImage(product).imageUrl}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 25vw, 45vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted">
              New pieces are on the way — check back soon.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
