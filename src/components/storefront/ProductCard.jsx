import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { formatPrice, discountPercent } from "@/lib/format";
import {
  primaryImage,
  sellingPrice,
  hasDiscount,
  stockStatus,
  stockBadge,
  STOCK_STATUS,
} from "@/lib/catalog";

/**
 * Product card for every product list (home, shop, category).
 * Server-safe (presentational). Data comes from GET /api/products.
 */
export default function ProductCard({ product, priority = false }) {
  const image = primaryImage(product);
  const discounted = hasDiscount(product);
  const price = sellingPrice(product);
  const status = stockStatus(product);
  const badge = stockBadge(product);
  const percent = discounted ? discountPercent(product.price, product.discountPrice) : null;
  const href = `/products/${product.slug ?? product.id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Link
        href={href}
        className="relative block aspect-[3/4] overflow-hidden bg-gradient-to-br from-background via-surface to-primary-soft"
        aria-label={`View ${product.name}`}
      >
        {image ? (
          <Image
            src={image.imageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-muted">
            {product.name}
          </span>
        )}

        <span className="absolute left-3 top-3 flex flex-col gap-1.5">
          {percent ? (
            <Badge tone="danger" className="shadow-sm">
              -{percent}%
            </Badge>
          ) : null}
          {status !== STOCK_STATUS.IN_STOCK ? (
            <Badge tone={badge.tone} className="shadow-sm">
              {badge.label}
            </Badge>
          ) : null}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.category ? (
          <Link
            href={`/categories/${product.category.slug}`}
            className="mb-1 w-fit text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:text-primary"
          >
            {product.category.name}
          </Link>
        ) : null}

        <h3 className="text-sm font-semibold leading-snug text-ink">
          <Link href={href} className="transition-colors hover:text-primary">
            {product.name}
          </Link>
        </h3>

        {product.brand ? (
          <p className="mt-0.5 text-xs text-muted">{product.brand}</p>
        ) : null}

        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-base font-semibold ${discounted ? "text-primary" : "text-ink"}`}>
            {formatPrice(price)}
          </span>
          {discounted ? (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.price)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          <Link
            href={href}
            className={buttonClassName("outline", "sm", "w-full")}
          >
            View Product
          </Link>
        </div>
      </div>
    </article>
  );
}
