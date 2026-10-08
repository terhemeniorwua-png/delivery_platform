import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use the Clothing Delivery Platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Last updated: October 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-ink">Using the platform</h2>
          <p className="mt-2">
            You need an account to place orders. Keep your login credentials
            secure and provide accurate delivery information so riders can
            reach you.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Orders and availability</h2>
          <p className="mt-2">
            All products are subject to availability. Stock is tracked per size
            and colour, and prices may change — the price shown at the time of
            your order is the price you pay.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Payments</h2>
          <p className="mt-2">
            Orders can be paid by cash, card or bank transfer. Payment records
            are kept against each order for your reference and ours.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Delivery</h2>
          <p className="mt-2">
            Orders are delivered by riders associated with the platform.
            Delivery availability depends on your address and rider capacity.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Questions</h2>
          <p className="mt-2">
            Anything unclear? Reach us through the{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
