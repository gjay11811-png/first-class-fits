import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "Shipping — First Class Fits" }, { name: "description", content: "Shipping rates, delivery times and international destinations for First Class Fits." }] }),
  component: () => (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Shipping</p>
      <h1 className="font-display text-5xl uppercase tracking-tighter mt-3">Shipping information</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/80">
        <Row title="Standard (UK)">2–4 business days · £6.99, free over £100</Row>
        <Row title="Express (UK)">1–2 business days · £15</Row>
        <Row title="Standard (US)">3–5 business days · £6.99, free over £100</Row>
        <Row title="Express (US)">1–2 business days · £25</Row>
        <Row title="International">5–10 business days · from £25 / £30. Duties calculated at checkout.</Row>
        <Row title="Processing time">All orders dispatch within 48 hours. Limited drops may take up to 5 business days.</Row>
        <Row title="Tracking">You'll receive a tracking link by email as soon as your order dispatches. Sign in to your account to track every order from a single place.</Row>
      </div>
    </article>
  ),
});
function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[200px_1fr] gap-3 py-4 border-b border-border">
      <h3 className="text-[11px] uppercase tracking-widest font-bold">{title}</h3>
      <p>{children}</p>
    </div>
  );
}
