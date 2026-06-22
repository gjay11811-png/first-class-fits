import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { getStripeEnvironment } from "@/lib/stripe";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { confirmPayment } from "@/lib/checkout.functions";

export const Route = createFileRoute("/order-success")({
  head: () => ({ meta: [{ title: "Order confirmed — First Class Fits" }] }),
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { session_id } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { clear } = useCart();
  const confirm = useServerFn(confirmPayment);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    clear();
  }, [clear]);

  useEffect(() => {
    if (!user || !session_id) { setConfirming(false); return; }
    confirm({ data: { sessionId: session_id, environment: getStripeEnvironment() } })
      .then((r) => { if (r.orderId) setOrderId(r.orderId); })
      .catch(() => {})
      .finally(() => setConfirming(false));
  }, [user, session_id, confirm]);

  const order = useQuery({
    queryKey: ["order", orderId],
    enabled: !!user && !!orderId,
    refetchInterval: (q) =>
      (q.state.data as { status?: string } | undefined)?.status === "pending" ? 2000 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!user || confirming || order.isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin mx-auto mb-3" />
        Confirming your payment…
      </div>
    );
  }
  if (!session_id) {
    return <div className="py-20 text-center text-sm text-muted-foreground">No payment session found.</div>;
  }
  if (!order.data) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Order not found.</div>;
  }

  const o = order.data as {
    id: string; status: string; email: string;
    subtotal: number; shipping: number; total: number; currency: string;
    shipping_address: { name?: string; line1?: string; city?: string; postal?: string; country?: string } | null;
    order_items: { id: string; title: string; quantity: number; unit_price: number; image_url: string | null }[];
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          {o.status === "pending" ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tighter">
          {o.status === "pending" ? "Processing payment…" : "Order confirmed"}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Order <span className="font-mono">{o.id.slice(0, 8).toUpperCase()}</span> — a confirmation has been sent to {o.email}.
      </p>

      <div className="border border-border p-6 space-y-4">
        <h2 className="text-[11px] uppercase tracking-widest font-bold">Items</h2>
        <ul className="divide-y divide-border">
          {o.order_items.map((i) => (
            <li key={i.id} className="flex gap-3 py-3">
              <div className="size-14 bg-surface shrink-0 overflow-hidden">
                {i.image_url && <img src={i.image_url} className="size-full object-cover" alt="" />}
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-semibold uppercase tracking-tight line-clamp-1">{i.title}</p>
                <p className="text-xs text-muted-foreground">Qty {i.quantity}</p>
              </div>
              <span className="text-sm font-bold">{formatPrice(Number(i.unit_price) * i.quantity, o.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 text-sm border-t border-border pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(Number(o.subtotal), o.currency)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{Number(o.shipping) === 0 ? "Free" : formatPrice(Number(o.shipping), o.currency)}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>Total</span><span>{formatPrice(Number(o.total), o.currency)}</span></div>
        </div>
        {o.shipping_address && (
          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            <p className="uppercase tracking-widest text-[10px] mb-1">Shipping to</p>
            <p>{o.shipping_address.name}</p>
            <p>{o.shipping_address.line1}</p>
            <p>{o.shipping_address.city} {o.shipping_address.postal}</p>
            <p>{o.shipping_address.country}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Link to="/account" className="bg-primary text-primary-foreground py-3 px-6 text-[11px] font-bold uppercase tracking-widest hover:brightness-110">View orders</Link>
        <Link to="/shop" className="border border-border py-3 px-6 text-[11px] font-bold uppercase tracking-widest hover:bg-surface">Keep shopping</Link>
      </div>
    </div>
  );
}
