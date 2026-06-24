import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — First Class Fits" },
      { name: "description", content: "The terms and conditions that apply when you shop with First Class Fits." },
    ],
    links: [{ rel: "canonical", href: "https://firstclassfits.co/terms" }],
  }),
  component: () => (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Legal</p>
      <h1 className="font-display text-5xl uppercase tracking-tighter mt-3">Terms &amp; conditions</h1>
      <p className="mt-4 text-xs text-muted-foreground">Last updated: June 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/80">
        <Section title="1. About these terms">
          <p>These terms apply to your use of firstclassfits.co and to any order you place with First Class Fits ("we", "us", "our"). By placing an order you agree to these terms. If you have a question, contact <a href="mailto:hello@firstclassfits.co" className="text-primary">hello@firstclassfits.co</a>.</p>
        </Section>

        <Section title="2. Products and pricing">
          <p>All prices are shown in pounds sterling (GBP) and include applicable taxes where stated. We make every effort to display products and prices accurately, but errors can occur. If we discover an error in the price or description of an item you have ordered, we will contact you before processing it and you may continue or cancel the order.</p>
        </Section>

        <Section title="3. Orders and payment">
          <p>When you place an order you will receive confirmation that we have received it. A contract is formed once we accept and process your payment. Payments are handled securely by Stripe; we accept major credit and debit cards. We reserve the right to refuse or cancel any order, for example where stock is unavailable or fraud is suspected.</p>
        </Section>

        <Section title="4. Delivery">
          <p>Delivery times and charges are set out on our <Link to="/shipping" className="text-primary">Shipping</Link> page. Delivery estimates are provided in good faith but are not guaranteed. Risk in the goods passes to you on delivery.</p>
        </Section>

        <Section title="5. Returns and refunds">
          <p>Your return and refund rights are set out on our <Link to="/returns" className="text-primary">Returns</Link> page. This does not affect your statutory rights as a consumer.</p>
        </Section>

        <Section title="6. Intellectual property">
          <p>All content on this site — including text, images, logos and design — is owned by or licensed to First Class Fits and may not be copied or reused without our written permission.</p>
        </Section>

        <Section title="7. Our liability">
          <p>We are responsible for foreseeable loss caused by us, but we do not exclude or limit our liability where it would be unlawful to do so, including for death or personal injury caused by our negligence or for fraud. We are not liable for losses that are not foreseeable or that arise from your own breach of these terms.</p>
        </Section>

        <Section title="8. Governing law">
          <p>These terms are governed by the laws of England and Wales, and any disputes will be subject to the courts of England and Wales.</p>
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
