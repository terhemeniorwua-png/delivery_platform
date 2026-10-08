import Link from "next/link";
import Image from "next/image";
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
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm0 0 8 5.5V21H4V11.5L12 6Z" />
      </svg>
    ),
  },
  {
    title: "Delivery by real riders",
    body: "Orders are handed to riders who manage availability, pickup and drop-off in one workflow.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3V7Zm11 3h4l3 3v4h-7v-7ZM7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      </svg>
    ),
  },
  {
    title: "Clear, honest information",
    body: "Prices, discounts and stock shown on the site come straight from the store's live data.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v5c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V7l-8-4Zm-3 9 2 2 4-4" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative isolate overflow-hidden border-b border-border">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(246,239,224,0.96)_0%,rgba(243,232,211,0.9)_48%,rgba(236,222,196,0.6)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,246,238,0.45)_0%,transparent_30%,transparent_72%,rgba(245,236,217,0.55)_100%)]"
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-600">
            About us
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Fashion delivered to your doorstep.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-sand-600 sm:text-lg">
            An online clothing store paired with a local delivery network — one
            simple flow from browsing to your door.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className={buttonClassName("primary", "lg")}>
              Start shopping
            </Link>
            <Link
              href="/contact"
              className={buttonClassName(
                "secondary",
                "lg",
                "border-sand-400/60 bg-white/80 hover:bg-white"
              )}
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* ------------------------------------------------------- intro */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-base leading-relaxed text-muted">
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
        </div>

        {/* ------------------------------------------------------- values */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="group rounded-2xl border border-border bg-gradient-to-b from-surface to-sand-50/60 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-soft to-sand-100 text-primary transition-transform duration-200 group-hover:scale-105">
                {value.icon}
              </span>
              <h2 className="mt-4 text-sm font-semibold text-ink">
                {value.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {value.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 sm:mt-16">
          <HowItWorks />
        </div>
      </div>
    </>
  );
}
