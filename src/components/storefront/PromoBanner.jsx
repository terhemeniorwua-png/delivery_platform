import Link from "next/link";
import Image from "next/image";
import { buttonClassName } from "@/components/ui/Button";
import { primaryImage } from "@/lib/catalog";

/**
 * Promotional banner. The optional image is a REAL catalogue product passed
 * in by the caller (no fake discount system — the discount badges on product
 * cards come from actual product data).
 */
export default function PromoBanner({ product = null, href = "/shop", eyebrow, title, description, cta }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl bg-ink text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/95 to-ink/60" />
        <div className="relative grid gap-6 p-8 sm:p-10 md:grid-cols-2 md:items-center md:p-12">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-soft">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-sm text-white/70 sm:text-base">{description}</p>
            <Link
              href={href}
              className={`${buttonClassName("primary", "lg")} mt-6`}
            >
              {cta}
            </Link>
          </div>

          {product && primaryImage(product) ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 md:aspect-[4/3]">
              <Image
                src={primaryImage(product).imageUrl}
                alt={product.name}
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
