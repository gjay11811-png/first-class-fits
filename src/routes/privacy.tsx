import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — First Class Fits" },
      { name: "description", content: "How First Class Fits collects, uses and protects your personal data." },
    ],
    links: [{ rel: "canonical", href: "https://firstclassfits.co/privacy" }],
  }),
  component: () => (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Legal</p>
      <h1 className="font-display text-5xl uppercase tracking-tighter mt-3">Privacy policy</h1>
      <p className="mt-4 text-xs text-muted-foreground">Last updated: June 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/80">
        <Section title="Who we are">
          <p>First Class Fits ("we", "us", "our") operates the store at firstclassfits.co. This policy explains what personal data we collect, how we use it, and the rights you have over it. If you have any questions, contact us at <a href="mailto:gjay11811@gmail.com" className="text-primary">gjay11811@gmail.com</a>.</p>
        </Section>

        <Section title="What we collect">
          <p>When you shop or create an account we may collect: your name, email address, delivery address, order history, and communications you send us. When you pay, your card details are entered directly with our payment processor (Stripe) — we never see or store your full card number.</p>
        </Section>

        <Section title="How we use your data">
          <ul className="list-disc pl-5 space-y-1">
            <li>To process and deliver your orders and send order confirmations and updates.</li>
            <li>To provide customer support and handle returns or refunds.</li>
            <li>To send marketing emails where you have signed up — you can unsubscribe at any time.</li>
            <li>To meet our legal and accounting obligations and to prevent fraud.</li>
          </ul>
        </Section>

        <Section title="Who we share it with">
          <p>We share data only with trusted providers who help us run the store, including: Stripe (payment processing), our delivery carriers (to ship your order), and our email provider (to send confirmations). We do not sell your personal data to anyone.</p>
        </Section>

        <Section title="How long we keep it">
          <p>We keep order and account information for as long as needed to provide our service and to meet legal and tax requirements (typically up to 6 years for transaction records), after which it is securely deleted.</p>
        </Section>

        <Section title="Your rights">
          <p>Under UK data protection law you have the right to access, correct, or delete your personal data, to object to or restrict its processing, and to request a copy of it. To exercise any of these rights, email <a href="mailto:gjay11811@gmail.com" className="text-primary">gjay11811@gmail.com</a> and we will respond within one month.</p>
        </Section>

        <Section title="Cookies">
          <p>We use essential cookies to keep your basket and session working, and may use analytics cookies to understand how the site is used so we can improve it. You can control cookies through your browser settings.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>We may update this policy from time to time. The latest version will always be available on this page with its effective date.</p>
        </Section>
      </div>
    </article>
  ),
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-widest font-bold text-foreground mb-2">{title}</h2>
      {children}
    </section>
  );
}
