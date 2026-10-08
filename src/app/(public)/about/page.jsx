import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import HowItWorks from "@/components/storefront/HowItWorks";

export const metadata = {
  title: "About",
  description:
    "The Clothing Delivery Platform brings online clothing shopping and local rider delivery together in one simple flow.",
};

const VALUES = [
  {
    title: "Clothing first",
    body: "The catalogue is built around garments — sizes, colours and stock are first-class, not an afterthought.",
  },
  {
    title: "Delivery by real riders",
    body: "Orders are handed to riders who manage availability, pickup and drop-off in one workflow.",
  },
  {
    title: "Clear, honest information",
    body: "Prices, discounts and stock shown on the site come straight from the store's live data.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">About us</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Fashion delivered to your doorstep.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          Clothing Delivery Platform is an online clothing store paired with a
          local delivery network. Customers browse a curated catalogue, place
          an order in a few taps, and a rider brings the package to their
          address — all tracked through one platform.
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Behind the scenes, three roles keep things moving: customers shop,
          riders handle deliveries, and administrators keep the catalogue,
          orders and deliveries in order.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/shop" className={buttonClassName("primary", "lg")}>
            Start shopping
          </Link>
          <Link href="/contact" className={buttonClassName("secondary", "lg")}>
            Contact us
          </Link>
        </div>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {VALUES.map((value) => (
          <div key={value.title} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">{value.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{value.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 sm:mt-16">
        <HowItWorks />
      </div>
    </div>
  );
}
