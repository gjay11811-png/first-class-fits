import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  lineId: string;
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  size: string | null;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity" | "lineId"> & { lineId?: string }, qty?: number) => void;
  remove: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "fcf-cart-v2";

function makeLineId(productId: string, size: string | null) {
  return `${productId}::${size ?? ""}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items, hydrated]);

  const add: CartContextType["add"] = (item, qty = 1) => {
    const lineId = item.lineId ?? makeLineId(item.productId, item.size ?? null);
    setItems((prev) => {
      const existing = prev.find((i) => i.lineId === lineId);
      if (existing) {
        return prev.map((i) => i.lineId === lineId ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { ...item, lineId, size: item.size ?? null, quantity: qty }];
    });
    setOpen(true);
  };
  const remove = (lineId: string) => setItems((p) => p.filter((i) => i.lineId !== lineId));
  const setQty = (lineId: string, qty: number) =>
    setItems((p) => qty <= 0 ? p.filter((i) => i.lineId !== lineId) : p.map((i) => i.lineId === lineId ? { ...i, quantity: qty } : i));
  const clear = () => setItems([]);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, open, setOpen, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
