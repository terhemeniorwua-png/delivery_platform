const STEPS = [
  {
    title: "Choose your clothes",
    description: "Browse the catalogue and pick the sizes and colours you love.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm0 0 8 5.5V21H4V11.5L12 6Z" />
      </svg>
    ),
  },
  {
    title: "Place your order",
    description: "Check out with cash, card or transfer — your choice.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "We prepare your package",
    description: "Your pieces are picked, checked and packed for the trip.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5m0-8 9 5" />
      </svg>
    ),
  },
  {
    title: "A rider delivers it",
    description: "A verified rider picks up the package and heads your way.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 17h2m10 0h2M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm18 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5 17l2.5-7h8L19 17m-11-7 1-3h4l1 3" />
      </svg>
    ),
  },
  {
    title: "Receive your order",
    description: "Try it on at home — and enjoy your new look.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l2-7 4 14 2-7h7" />
      </svg>
    ),
  },
];

/** "How delivery works" — clearly a clothing + delivery platform. */
export default function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6" aria-labelledby="how-it-works-heading">
      <div className="mb-8 max-w-2xl">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          How it works
        </p>
        <h2 id="how-it-works-heading" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          From closet to doorstep in five steps
        </h2>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="relative rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {step.icon}
              </span>
              <span className="text-xs font-semibold text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-ink">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
