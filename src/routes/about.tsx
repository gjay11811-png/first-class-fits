import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — First Class Fits" },
      { name: "description", content: "First Class Fits is a curated premium retailer at the intersection of technical performance and high-luxury aesthetic — fashion, footwear and lifestyle electronics." },
      { property: "og:title", content: "About First Class Fits" },
      { property: "og:description", content: "Technical performance meets high-luxury aesthetic — discover the standard behind every First Class Fits drop." },
      { property: "og:url", content: "https://firstclassfits.co/about" },
    ],
    links: [{ rel: "canonical", href: "https://firstclassfits.co/about" }],
  }),
  component: () => (
    <article className="max-w-3xl mx-auto px-6 py-16 prose-invert">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">About</p>
      <h1 className="font-display text-5xl uppercase tracking-tighter mt-3">Built for the elite.</h1>
      <p className="mt-6 text-base text-foreground/80 leading-relaxed">First Class Fits is a multi-category retailer at the intersection of technical performance and high-luxury aesthetic. We curate every drop personally — from sealed-seam outerwear to reference-tuned headphones — and partner directly with our makers to keep margins, and quality, honest.</p>
      <p className="mt-4 text-base text-foreground/80 leading-relaxed">Every order is quality-checked and tracked, and every customer gets the same first-class treatment. That's the standard.</p>
    </article>
  ),
});
