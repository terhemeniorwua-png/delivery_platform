import ProductCard from "./ProductCard";
import Skeleton from "@/components/ui/Skeleton";

/** Responsive product grid used by home, shop and category pages. */
export function ProductGrid({ children, className = "" }) {
  return (
    <div
      className={`grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {children}
    </div>
  );
}

export default function ProductGridWithItems({ products, priority = false }) {
  return (
    <ProductGrid>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={priority && index < 4} />
      ))}
    </ProductGrid>
  );
}

/** Shimmering product-card placeholders (loading state). */
export function ProductCardSkeletons({ count = 8 }) {
  return (
    <ProductGrid>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface p-4">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="mt-4 h-3 w-1/3" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <Skeleton className="mt-4 h-9 w-full" />
        </div>
      ))}
    </ProductGrid>
  );
}
