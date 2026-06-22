import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — First Class Fits" },
      { name: "description", content: "Review the items in your First Class Fits cart and proceed to secure checkout with free UK shipping over £120." },
      { property: "og:title", content: "Your cart — First Class Fits" },
      { property: "og:description", content: "Review your selection and check out securely at First Class Fits." },
      { property: "og:url", content: "https://firstclassfits.co/cart" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://firstclassfits.co/cart" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tighter mb-10">Your cart</h1>
      {items.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          Your cart is empty.
          <div className="mt-6"><Link to="/shop" className="inline-block bg-primary text-primary-foreground px-6 py-3 text-[11px] font-bold uppercase tracking-widest">Browse shop</Link></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_360px] gap-10">
          <div className="divide-y divide-border border-y border-border">
            {items.map((i) => (
              <div key={i.lineId} className="flex gap-4 py-5">
                <div className="size-24 bg-surface shrink-0 overflow-hidden">
                  {i.image && <img src={i.image} alt={i.title} className="size-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to="/product/$slug" params={{ slug: i.slug }} className="text-sm font-semibold uppercase tracking-tight hover:text-primary">{i.title}</Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPrice(i.price)}{i.size ? ` · Size ${i.size}` : ""}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => setQty(i.lineId, i.quantity - 1)} className="size-8 grid place-items-center border border-border"><Minus className="size-3" /></button>
                    <span className="w-8 text-center">{i.quantity}</span>
                    <button onClick={() => setQty(i.lineId, i.quantity + 1)} className="size-8 grid place-items-center border border-border"><Plus className="size-3" /></button>
                    <button onClick={() => remove(i.lineId)} className="ml-3 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </div>
                <div className="text-sm font-bold">{formatPrice(i.price * i.quantity)}</div>
              </div>
            ))}
          </div>
          <aside className="border border-border p-6 h-fit space-y-4">
            <h2 className="text-[11px] uppercase tracking-widest font-bold">Summary</h2>
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping</span><span className="text-muted-foreground">Calculated at checkout</span></div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-3"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
            <Link to="/checkout" className="block text-center bg-primary text-primary-foreground py-4 text-[11px] font-bold uppercase tracking-widest hover:brightness-110">Checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
