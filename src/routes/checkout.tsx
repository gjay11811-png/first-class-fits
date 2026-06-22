import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/format";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { createCheckoutSession } from "@/lib/checkout.functions";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — First Class Fits" }] }),
  component: CheckoutPage,
});

type Stage = "form" | "pay";

function CheckoutPage() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const startCheckout = useServerFn(createCheckoutSession);
  const [stage, setStage] = useState<Stage>("form");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: user?.email ?? "",
    name: "",
    line1: "",
    city: "",
    postal: "",
    country: "United Kingdom",
  });
  const [submitting, setSubmitting] = useState(false);

  const shipping = subtotal >= 150 ? 0 : 12;
  const total = subtotal + shipping;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!user) {
      toast.message("Please sign in to place your order.");
      navigate({ to: "/auth", search: { redirect: "/checkout" } as never });
      return;
    }
    setSubmitting(true);
    try {
      const result = await startCheckout({
        data: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          email: form.email,
          shipping_address: { name: form.name, line1: form.line1, city: form.city, postal: form.postal, country: form.country },
          returnUrl: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in result) throw new Error(result.error);
      if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
      setClientSecret(result.clientSecret);
      setStage("pay");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PaymentTestModeBanner />
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tighter mb-10">Checkout</h1>
        {items.length === 0 ? (
          <p className="text-muted-foreground">Your cart is empty.</p>
        ) : stage === "pay" && clientSecret ? (
          <EmbeddedStripe clientSecret={clientSecret} onBack={() => { setStage("form"); setClientSecret(null); }} />

        ) : (
          <form onSubmit={submit} className="grid md:grid-cols-[1fr_400px] gap-10">
            <div className="space-y-6">
              <Section title="Contact">
                <Input label="Email" type="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              </Section>
              <Section title="Shipping address">
                <Input label="Full name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Input label="Address" required value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                  <Input label="Postal code" required value={form.postal} onChange={(v) => setForm({ ...form, postal: v })} />
                </div>
                <Input label="Country" required value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
              </Section>
              <Section title="Payment">
                <p className="text-xs text-muted-foreground">Secure card payment on the next step. Free UK shipping over £120 / US £150 — otherwise £12 standard shipping applies.</p>
              </Section>
            </div>
            <aside className="border border-border p-6 h-fit space-y-4">
              <h2 className="text-[11px] uppercase tracking-widest font-bold">Order</h2>
              <ul className="divide-y divide-border max-h-72 overflow-y-auto">
                {items.map((i) => (
                  <li key={i.lineId} className="flex gap-3 py-3">
                    <div className="size-14 bg-surface shrink-0 overflow-hidden">
                      {i.image && <img src={i.image} className="size-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-semibold uppercase tracking-tight line-clamp-1">{i.title}</p>
                      <p className="text-xs text-muted-foreground">Qty {i.quantity}{i.size ? ` · Size ${i.size}` : ""}</p>
                    </div>
                    <span className="text-sm font-bold">{formatPrice(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 text-sm border-t border-border pt-3">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>
              <button disabled={submitting} className="w-full bg-primary text-primary-foreground py-4 text-[11px] font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50">
                {submitting ? "Loading payment..." : "Continue to payment"}
              </button>
            </aside>
          </form>
        )}
      </div>
    </>
  );
}

function EmbeddedStripe({ clientSecret, onBack }: { clientSecret: string; onBack: () => void }) {
  const fetchClientSecret = useCallback(async () => clientSecret, [clientSecret]);
  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Edit details</button>
      <div id="checkout">
        <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border p-6 space-y-3">
      <h3 className="text-[11px] uppercase tracking-widest font-bold">{title}</h3>
      {children}
    </div>
  );
}
function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent border border-border focus:border-primary outline-none px-3 py-3 text-sm" />
    </label>
  );
}
