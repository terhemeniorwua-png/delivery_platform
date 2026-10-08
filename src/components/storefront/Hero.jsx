import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import HeroSlideshow from "./HeroSlideshow";

/**
 * Storefront hero: rotating full-bleed clothing photography (crossfades
 * every 3s) under a warm-sand overlay that is strongest in the middle so
 * the centred copy stays AA-legible on every slide. Entrance animations
 * are CSS-only and respect prefers-reduced-motion (see globals.css).
 */
export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[540px] items-center justify-center overflow-hidden border-b border-border sm:min-h-[600px] lg:min-h-[660px]">
      {/* ---------------------------------------------------- background */}
      <HeroSlideshow />

      {/* Warm sand overlay: heavy behind the centred copy, lighter at the
          edges so the photography still breathes. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(246,239,224,0.96)_0%,rgba(243,232,211,0.88)_45%,rgba(236,222,196,0.55)_78%,rgba(230,213,179,0.35)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,246,238,0.5)_0%,transparent_28%,transparent_70%,rgba(245,236,217,0.6)_100%)]"
      />

      {/* ------------------------------------------------------- content */}
      <div className="relative mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
        <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.2em] text-sand-600">
          New season &middot; delivered to you
        </p>
        <h1 className="animate-fade-up animate-delay-1 mt-4 text-5xl font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-7xl">
          Fashion delivered to your doorstep.
        </h1>
        <p className="animate-fade-up animate-delay-2 mx-auto mt-5 max-w-xl text-base leading-relaxed text-sand-600 sm:text-lg">
          Browse curated clothing for men, women and kids — pick your size and
          colour, place your order, and a rider brings it straight to you.
        </p>

        <div className="animate-fade-up animate-delay-3 mt-8 flex flex-wrap justify-center gap-3">
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

        <dl className="animate-fade-up animate-delay-3 mx-auto mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-sand-400/50 pt-6">
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
    </section>
  );
}
