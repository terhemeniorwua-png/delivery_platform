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
  },
  {
    title: "Riders & deliveries",
    value: "Via your account",
    description: "Signed-in customers and riders manage deliveries in their dashboard.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          We&apos;d love to hear from you
        </h1>
        <p className="mt-4 text-base text-muted">
          Questions about an order, a product or riding with us? Send a
          message and we&apos;ll get back to you by email.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {CHANNELS.map((channel) => (
            <Card key={channel.title}>
              <CardHeader title={channel.title} />
              <p className="text-sm font-medium text-ink">{channel.value}</p>
              <p className="mt-1 text-sm text-muted">{channel.description}</p>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-3">
          <CardHeader title="Send a message" description="Fill in the form and we'll take it from there." />
          <ContactForm />
        </Card>
      </div>
    </div>
  );
}
