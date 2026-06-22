import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns — First Class Fits" }, { name: "description", content: "Free 30-day returns on full-price items. Read the full First Class Fits returns policy." }] }),
  component: () => (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Returns</p>
      <h1 className="font-display text-5xl uppercase tracking-tighter mt-3">Returns policy</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground/80">
        <p>Free 30-day returns on full-price items in original condition with tags attached. Sale items can be exchanged within 14 days.</p>
        <p>To start a return, sign in to your account, open the order, and select "Request return". A pre-paid label will be emailed to you within 24 hours.</p>
        <p>Refunds are issued to your original payment method within 5 business days of us receiving the return.</p>
        <p>Electronics and worn footwear are eligible for exchange only.</p>
      </div>
    </article>
  ),
});
