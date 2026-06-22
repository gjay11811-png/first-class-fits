import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { open, setOpen, items, setQty, remove, subtotal } = useCart();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-background border-l border-border flex flex-col">
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <ShoppingBag className="size-4" /> Cart ({items.length})
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              Your cart is empty.
              <div className="mt-4">
                <Link to="/shop" onClick={() => setOpen(false)} className="inline-block bg-primary text-primary-foreground px-5 py-2 text-[11px] font-bold uppercase tracking-widest">Shop now</Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((i) => (
                <li key={i.lineId} className="flex gap-4 p-4">
                  <div className="size-20 bg-surface shrink-0 overflow-hidden">
                    {i.image && <img src={i.image} alt={i.title} className="size-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/product/$slug" params={{ slug: i.slug }} onClick={() => setOpen(false)} className="text-sm font-semibold uppercase tracking-tight line-clamp-2 hover:text-primary">{i.title}</Link>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatPrice(i.price)}{i.size ? ` · Size ${i.size}` : ""}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => setQty(i.lineId, i.quantity - 1)} className="size-7 grid place-items-center border border-border hover:border-primary"><Minus className="size-3" /></button>
                      <span className="text-sm w-6 text-center">{i.quantity}</span>
                      <button onClick={() => setQty(i.lineId, i.quantity + 1)} className="size-7 grid place-items-center border border-border hover:border-primary"><Plus className="size-3" /></button>
                      <button onClick={() => remove(i.lineId)} className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="uppercase tracking-widest text-muted-foreground">Subtotal</span>
              <span className="font-bold">{formatPrice(subtotal)}</span>
            </div>
            <Link to="/checkout" onClick={() => setOpen(false)} className="block text-center bg-primary text-primary-foreground py-4 text-[11px] font-bold uppercase tracking-widest hover:brightness-110">
              Checkout
            </Link>
            <Link to="/cart" onClick={() => setOpen(false)} className="block text-center border border-border py-3 text-[11px] font-bold uppercase tracking-widest hover:border-primary">
              View cart
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
