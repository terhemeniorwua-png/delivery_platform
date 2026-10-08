import Link from "next/link";
import Image from "next/image";
import { productCountLabel } from "@/lib/format";

/** Deterministic soft gradient per category (visual only — not data). */
function gradientFor(slug = "") {
  const palettes = [
    "from-blue-100 to-indigo-50",
    "from-rose-100 to-orange-50",
    "from-emerald-100 to-teal-50",
    "from-violet-100 to-fuchsia-50",
    "from-amber-100 to-yellow-50",
    "from-cyan-100 to-sky-50",
    "from-fuchsia-100 to-pink-50",
    "from-lime-100 to-green-50",
  ];
  let hash = 0;
  for (const char of slug) hash = (hash + char.charCodeAt(0)) % palettes.length;
  return palettes[hash];
}

/**
 * Category card for the home page and /categories.
 * `cover` (a real product image URL from the API) powers the visual;
 * without one it falls back to a tinted panel with the category name.
 */
export default function CategoryCard({ category, cover = null }) {
  const href = `/categories/${category.slug}`;

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div
        className={`relative aspect-[4/5] w-full bg-gradient-to-br ${gradientFor(category.slug)}`}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-lg font-semibold text-ink/30">
            {category.name}
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-base font-semibold text-white">{category.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-white/80">
            {category.description || productCountLabel(category.productCount)}
          </p>
        </div>
      </div>
      <span className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-muted">{productCountLabel(category.productCount)}</span>
        <span className="font-medium text-primary transition-transform duration-200 group-hover:translate-x-0.5">
          Shop <span aria-hidden="true">&rarr;</span>
        </span>
      </span>
    </Link>
  );
}
