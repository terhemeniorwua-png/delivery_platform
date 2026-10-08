const REASONS = [
  {
    title: "Quality clothing",
    description: "A curated catalogue of everyday wear, sportswear and native outfits.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v5c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V7l-8-4Z" />
      </svg>
    ),
  },
  {
    title: "Doorstep delivery",
    description: "A dedicated rider network delivers orders to your address.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3V7Zm11 3h4l3 3v4h-7v-7ZM7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      </svg>
    ),
  },
  {
    title: "Flexible payments",
    description: "Pay by cash, card or bank transfer — whichever suits you.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 4h18M7 15h4" />
      </svg>
    ),
  },
  {
    title: "Easy ordering",
    description: "Pick a size, add it to your cart and place the order in a few taps.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4 12 5 5L20 6" />
      </svg>
    ),
  },
];

/** Short trust section — claims kept modest and verifiable. */
export default function WhyUs() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6" aria-labelledby="why-us-heading">
      <div className="mb-8 max-w-2xl">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          Why shop with us
        </p>
        <h2 id="why-us-heading" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Built around clothing and delivery
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((reason) => (
          <div
            key={reason.title}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
              {reason.icon}
            </span>
            <h3 className="mt-4 text-sm font-semibold text-ink">{reason.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{reason.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
