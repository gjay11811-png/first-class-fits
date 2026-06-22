import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const items = [
  { q: "When will my order ship?", a: "Standard orders dispatch within 48 hours. Limited drops may take up to 5 business days." },
  { q: "Do you ship internationally?", a: "Yes. We ship from the UK with tracked priority delivery. Same service for the US. Duties calculated at checkout." },
  { q: "What is your returns policy?", a: "Free 30-day returns on full-price items in original condition. Sale items can be exchanged within 14 days." },
  { q: "Are your products authentic?", a: "Every item undergoes a triple-stage verification. NFC chips embedded in footwear and electronics verify ledger entry." },
  { q: "How do I track my order?", a: "You'll receive an email with a tracking link as soon as your order dispatches." },
  { q: "Do you offer gift wrapping?", a: "Yes — select gift wrap at checkout for £8." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Shipping, returns & authenticity | First Class Fits" },
      { name: "description", content: "Frequently asked questions about ordering, international shipping, 30-day returns and product authentication at First Class Fits." },
      { property: "og:title", content: "Frequently asked questions — First Class Fits" },
      { property: "og:description", content: "Answers about shipping, returns, authentication and order tracking at First Class Fits." },
      { property: "og:url", content: "https://firstclassfits.co/faq" },
    ],
    links: [{ rel: "canonical", href: "https://firstclassfits.co/faq" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    }],
  }),
  component: FaqPage,
});

function FaqPage() {
  const [open, setOpen] = useState(0);
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">FAQ</p>
      <h1 className="font-display text-5xl uppercase tracking-tighter mt-3">Frequently asked</h1>
      <div className="mt-10 divide-y divide-border border-y border-border">
        {items.map((it, i) => (
          <div key={i} className="py-5">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex justify-between items-center text-left">
              <span className="text-sm font-semibold uppercase tracking-tight">{it.q}</span>
              <span className="text-primary text-xl">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{it.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
