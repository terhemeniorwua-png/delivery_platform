export const metadata = {
  title: "Privacy Policy",
  description: "How the Clothing Delivery Platform handles your information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: October 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-ink">Information we collect</h2>
          <p className="mt-2">
            When you create an account we store your name, email address and
            phone number. When you place orders we store your delivery
            addresses, order contents and payment records so we can fulfil and
            support them.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">How we use it</h2>
          <p className="mt-2">
            Your information is used to process orders, coordinate deliveries
            with riders, and respond to support requests. We do not sell your
            personal information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Session data</h2>
          <p className="mt-2">
            After signing in, a session token is kept in your browser&apos;s
            local storage so you stay signed in. You can remove it at any time
            by signing out, which clears the token from your device.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Contact</h2>
          <p className="mt-2">
            Questions about your data? Reach us through the{" "}
            <a href="/contact" className="font-medium text-primary hover:underline">
              contact page
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
