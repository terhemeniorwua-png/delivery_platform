import ContactForm from "@/components/storefront/ContactForm";
import Card, { CardHeader } from "@/components/ui/Card";

export const metadata = {
  title: "Contact",
  description:
    "Get in touch about orders, products or deliveries — we read every message.",
};

const CHANNELS = [
  {
    title: "Email",
    value: "admin@clothing-delivery.test",
    description: "Best for order questions, product questions and feedback.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-8Zm0 0L12 14l9-5.5" />
      </svg>
    ),
  },
  {
    title: "Riders & deliveries",
    value: "Via your account",
    description:
      "Signed-in customers and riders manage deliveries in their dashboard.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3V7Zm11 3h4l3 3v4h-7v-7ZM7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* ------------------------------------------------------ header band */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-sand-200/70 bg-gradient-to-br from-sand-100 via-surface to-primary-soft px-6 py-10 sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-14 size-48 rounded-full bg-sand-300/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 left-8 size-40 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Questions about an order, a product or riding with us? Send a
            message and we&apos;ll get back to you by email.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------- content */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {CHANNELS.map((channel) => (
            <div
              key={channel.title}
              className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-soft to-sand-100 text-primary transition-transform duration-200 group-hover:scale-105">
                  {channel.icon}
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-ink">
                    {channel.title}
                  </h2>
                  <p className="mt-0.5 break-words text-sm font-medium text-primary">
                    {channel.value}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {channel.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-50/70 p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-sand-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Prefer self-service?
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  Signed-in customers can track orders under{" "}
                  <span className="font-medium text-ink">My Orders</span> —
                  status, payment and delivery details update as things move.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-lg lg:col-span-3">
          <CardHeader
            title="Send a message"
            description="Fill in the form and we'll take it from there."
          />
          <ContactForm />
        </Card>
      </div>
    </div>
  );
}
