import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { getStripeEnvironment } from "@/lib/stripe";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { confirmPayment, getGuestCheckoutSummary, type GuestOrderSummary } from "@/lib/checkout.functions";

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
  const { clear } = useCart();

  // Empty the cart once we've landed on the confirmation page.
  useEffect(() => {
    clear();
  }, [clear]);

  if (loading) {
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
  // Logged-in customers have a tracked order in the database; guests are
  // confirmed straight from their Stripe session.
  return user ? <MemberSuccess sessionId={session_id} /> : <GuestSuccess sessionId={session_id} />;
}

// ── Logged-in customer ──────────────────────────────────────────────────────
function MemberSuccess({ sessionId }: { sessionId: string }) {
  const confirm = useServerFn(confirmPayment);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(true);

  useEffect(() => {
    confirm({ data: { sessionId, environment: getStripeEnvironment() } })
      .then((r) => { if (r.orderId) setOrderId(r.orderId); })
      .catch(() => {})
      .finally(() => setConfirming(false));
  }, [sessionId, confirm]);

  const order = useQuery({
    queryKey: ["order", orderId],
    enabled: !!orderId,
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

  if (confirming || order.isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin mx-auto mb-3" />
        Confirming your payment…
      </div>
    );
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
    <Confirmation
      heading={o.status === "pending" ? "Processing payment…" : "Order confirmed"}
      pending={o.status === "pending"}
      orderRef={o.id.slice(0, 8).toUpperCase()}
      email={o.email}
      items={o.order_items.map((i) => ({
        key: i.id,
        name: i.title,
        quantity: i.quantity,
        image: i.image_url,
        amount: Number(i.unit_price) * i.quantity,
      }))}
      subtotal={Number(o.subtotal)}
      shipping={Number(o.shipping)}
      total={Number(o.total)}
      currency={o.currency}
      shippingAddress={o.shipping_address}
      showAccountLink
    />
  );
}

// ── Guest customer ──────────────────────────────────────────────────────────
function GuestSuccess({ sessionId }: { sessionId: string }) {
  const summarize = useServerFn(getGuestCheckoutSummary);
  const [data, setData] = useState<GuestOrderSummary | null>(null);

  useEffect(() => {
    summarize({ data: { sessionId, environment: getStripeEnvironment() } })
      .then(setData)
      .catch(() => setData({ found: false }));
  }, [sessionId, summarize]);

  if (!data) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin mx-auto mb-3" />
        Confirming your payment…
      </div>
    );
  }
  if (!data.found) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Order not found.</div>;
  }

  const pending = data.paymentStatus !== "paid" && data.paymentStatus !== "no_payment_required";
  return (
    <Confirmation
      heading={pending ? "Processing payment…" : "Order confirmed"}
      pending={pending}
      orderRef={data.sessionId.slice(-8).toUpperCase()}
      email={data.email}
      items={data.items.map((i, idx) => ({
        key: String(idx),
        name: i.name,
        quantity: i.quantity,
        image: null,
        amount: i.amount,
        amountIsTotal: true,
      }))}
      subtotal={data.subtotal}
      shipping={data.shipping}
      total={data.total}
      currency={data.currency}
      shippingAddress={data.shippingAddress}
      amountsInMinor
    />
  );
}

// ── Shared confirmation layout ──────────────────────────────────────────────
type Item = { key: string; name: string; quantity: number; image: string | null; amount: number; amountIsTotal?: boolean };

function Confirmation(props: {
  heading: string;
  pending: boolean;
  orderRef: string;
  email: string;
  items: Item[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress: { name?: string; line1?: string; city?: string; postal?: string; country?: string } | null;
  showAccountLink?: boolean;
  amountsInMinor?: boolean;
}) {
  // Member amounts are in major units (£), guest/Stripe amounts are in minor (pence).
  const money = (n: number) => formatPrice(props.amountsInMinor ? n / 100 : n, props.currency);

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          {props.pending ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tighter">{props.heading}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Order <span className="font-mono">{props.orderRef}</span>
        {props.email ? <> — a confirmation has been sent to {props.email}.</> : "."}
      </p>

      <div className="border border-border p-6 space-y-4">
        <h2 className="text-[11px] uppercase tracking-widest font-bold">Items</h2>
        <ul className="divide-y divide-border">
          {props.items.map((i) => (
            <li key={i.key} className="flex gap-3 py-3">
              <div className="size-14 bg-surface shrink-0 overflow-hidden">
                {i.image && <img src={i.image} className="size-full object-cover" alt="" />}
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-semibold uppercase tracking-tight line-clamp-1">{i.name}</p>
                <p className="text-xs text-muted-foreground">Qty {i.quantity}</p>
              </div>
              <span className="text-sm font-bold">{money(i.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 text-sm border-t border-border pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(props.subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{props.shipping === 0 ? "Free" : money(props.shipping)}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>Total</span><span>{money(props.total)}</span></div>
        </div>
        {props.shippingAddress && (
          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            <p className="uppercase tracking-widest text-[10px] mb-1">Shipping to</p>
            <p>{props.shippingAddress.name}</p>
            <p>{props.shippingAddress.line1}</p>
            <p>{props.shippingAddress.city} {props.shippingAddress.postal}</p>
            <p>{props.shippingAddress.country}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        {props.showAccountLink && (
          <Link to="/account" className="bg-primary text-primary-foreground py-3 px-6 text-[11px] font-bold uppercase tracking-widest hover:brightness-110">View orders</Link>
        )}
        <Link to="/shop" className="border border-border py-3 px-6 text-[11px] font-bold uppercase tracking-widest hover:bg-surface">Keep shopping</Link>
      </div>
    </div>
  );
}
