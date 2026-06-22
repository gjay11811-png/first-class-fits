import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    setLoading(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("Could not subscribe. Try again.");
    } else {
      toast.success("Welcome to the inner circle.");
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-5">
            <Link to="/" className="font-serif text-3xl tracking-tight">First Class Fits</Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Defining the intersection of technical utility and high-luxury aesthetic. Globally sourced, locally minded.
            </p>
            <form onSubmit={subscribe} className="mt-8 max-w-sm">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Join the Inner Circle</label>
              <div className="mt-2 flex border border-border focus-within:border-primary transition-colors">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email"
                  className="flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none" />
                <button disabled={loading} className="bg-primary text-primary-foreground px-4 py-3 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50">
                  {loading ? "..." : "Join"}
                </button>
              </div>
            </form>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[11px] uppercase tracking-widest font-bold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/shop" className="hover:text-primary">All Products</Link></li>
              <li><Link to="/shop" search={{ category: "footwear" } as never} className="hover:text-primary">Footwear</Link></li>
              <li><Link to="/shop" search={{ category: "electronics" } as never} className="hover:text-primary">Electronics</Link></li>
              <li><Link to="/shop" search={{ sale: "1" } as never} className="hover:text-primary">Sale</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[11px] uppercase tracking-widest font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              <li><Link to="/shipping" className="hover:text-primary">Shipping</Link></li>
              <li><Link to="/returns" className="hover:text-primary">Returns</Link></li>
              <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-[11px] uppercase tracking-widest font-bold mb-4">Trust</h4>
            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="border border-border px-2 py-1">Secure 256-bit</span>
              <span className="border border-border px-2 py-1">Authentic</span>
              <span className="border border-border px-2 py-1">Free Returns</span>
              <span className="border border-border px-2 py-1">Global Shipping</span>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-border flex flex-col md:flex-row justify-between gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>© 2026 First Class Fits. All rights reserved.</span>
          <span>Built for the elite.</span>
        </div>
      </div>
    </footer>
  );
}
