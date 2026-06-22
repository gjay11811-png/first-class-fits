import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — First Class Fits" },
      { name: "description", content: "Reach the First Class Fits client services team for order help, sizing advice or wholesale enquiries. We respond within 24 hours." },
      { property: "og:title", content: "Contact First Class Fits" },
      { property: "og:description", content: "Get in touch with our client services team — we respond within 24 hours." },
      { property: "og:url", content: "https://firstclassfits.co/contact" },
    ],
    links: [{ rel: "canonical", href: "https://firstclassfits.co/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
      <h1 className="font-display text-5xl uppercase tracking-tighter mt-3">Client services</h1>
      <p className="mt-4 text-sm text-muted-foreground">We respond within 24 hours. Or email <a className="text-primary" href="mailto:hello@firstclassfits.com">hello@firstclassfits.com</a>.</p>
      {sent ? (
        <div className="mt-10 p-6 border border-primary text-sm">Thanks — we'll be in touch shortly.</div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Message received"); setSent(true); }} className="mt-10 space-y-4">
          <label className="block"><span className="text-[10px] uppercase tracking-widest text-muted-foreground">Name</span>
            <input required className="mt-1 w-full bg-transparent border border-border px-3 py-3 text-sm focus:border-primary outline-none" /></label>
          <label className="block"><span className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
            <input type="email" required className="mt-1 w-full bg-transparent border border-border px-3 py-3 text-sm focus:border-primary outline-none" /></label>
          <label className="block"><span className="text-[10px] uppercase tracking-widest text-muted-foreground">Message</span>
            <textarea required rows={5} className="mt-1 w-full bg-transparent border border-border px-3 py-3 text-sm focus:border-primary outline-none" /></label>
          <button className="bg-primary text-primary-foreground py-3 px-6 text-[11px] font-bold uppercase tracking-widest">Send message</button>
        </form>
      )}
    </div>
  );
}
