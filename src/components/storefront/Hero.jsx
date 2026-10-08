import Link from "next/link";
import Image from "next/image";
import { buttonClassName } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { primaryImage, sellingPrice } from "@/lib/catalog";

/**
 * Storefront hero: full-bleed lifestyle photograph with a clean warm-sand
 * overlay (sand-100 → transparent, left → right) so the copy stays crisp on
 * every viewport. Entrance animations are CSS-only and respect
 * prefers-reduced-motion (see globals.css).
 *
 * When real featured products are passed in from the home page (API data),
 * one floating price card keeps the hero grounded in the live catalogue.
 */
export default function Hero({ products = [] }) {
  const featured = products.find((product) => primaryImage(product));

  return (
    <section className="relative isolate flex min-h-[540px] items-center overflow-hidden border-b border-border sm:min-h-[600px] lg:min-h-[660px]">
      {/* ---------------------------------------------------- background */}
      <Image
        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=80"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Warm sand overlay: opaque enough for AA text contrast on the copy
          side, fading out to let the photograph breathe on the right. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(100deg,rgba(245,236,217,0.97)_0%,rgba(238,225,199,0.93)_38%,rgba(230,213,179,0.62)_66%,rgba(224,204,167,0.22)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,246,238,0.35)_0%,transparent_30%,transparent_72%,rgba(245,236,217,0.45)_100%)]"
      />

      {/* ------------------------------------------------------- content */}
      <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:py-24">
        <div className="max-w-2xl">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.2em] text-sand-600">
            New season &middot; delivered to you
          </p>
          <h1 className="animate-fade-up animate-delay-1 mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Fashion delivered to your doorstep.
          </h1>
          <p className="animate-fade-up animate-delay-2 mt-5 max-w-xl text-base leading-relaxed text-sand-600 sm:text-lg">
            Browse curated clothing for men, women and kids — pick your size and
            colour, place your order, and a rider brings it straight to you.
          </p>

          <div className="animate-fade-up animate-delay-3 mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className={buttonClassName("primary", "lg")}>
              Shop Now
            </Link>
            <Link
              href="/categories"
              className={buttonClassName(
                "secondary",
                "lg",
                "border-sand-400/60 bg-white/80 hover:bg-white"
              )}
            >
              Explore Categories
            </Link>
          </div>

          <dl className="animate-fade-up animate-delay-3 mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-sand-400/50 pt-6">
            {[
              ["Fast delivery", "Riders at your door"],
              ["Easy returns", "7-day peace of mind"],
              ["Pay your way", "Cash, card or transfer"],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="text-sm font-semibold text-ink">{term}</dt>
                <dd className="mt-0.5 text-xs text-sand-600">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Live catalogue price card — real product data from the API. */}
        {featured ? (
          <Link
            href={`/products/${featured.slug ?? featured.id}`}
            className="animate-fade-up animate-delay-3 hidden w-64 overflow-hidden rounded-2xl border border-sand-300/70 bg-surface/95 p-3 shadow-xl shadow-sand-600/10 backdrop-blur transition-transform hover:-translate-y-1 md:block"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand-100">
              <Image
                src={primaryImage(featured).imageUrl}
                alt={featured.name}
                fill
                sizes="256px"
                className="object-cover"
              />
            </div>
            <div className="px-1 pb-1 pt-3">
              <p className="truncate text-sm font-semibold text-ink">{featured.name}</p>
              <p className="mt-1 text-base font-semibold text-primary">
                {formatPrice(sellingPrice(featured))}
              </p>
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
