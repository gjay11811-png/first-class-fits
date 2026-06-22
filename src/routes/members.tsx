import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useState } from "react";
import { toast } from "sonner";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/useSubscription";
import { createSubscriptionCheckout, createMembersPortalSession } from "@/lib/subscriptions.functions";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Members Club — First Class Fits" },
      { name: "description", content: "Join the Members Club for exclusive perks, early access, and member pricing." },
    ],
  }),
  component: MembersPage,
});

type PriceId = "members_monthly" | "members_yearly";

function MembersPage() {
  const { user, loading: authLoading } = useAuth();
  const { subscription, isActive, loading: subLoading } = useSubscription();
  const startCheckout = useServerFn(createSubscriptionCheckout);
  const openPortal = useServerFn(createMembersPortalSession);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const subscribe = async (priceId: PriceId) => {
    if (!user) {
      toast.message("Please sign in to join.");
      return;
    }
    setBusy(true);
    try {
      const result = await startCheckout({
        data: {
          priceId,
          returnUrl: `${window.location.origin}/members?welcome=1`,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in result) throw new Error(result.error);
      setClientSecret(result.clientSecret);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  };

  const manage = async () => {
    setBusy(true);
    try {
      const result = await openPortal({
        data: { returnUrl: `${window.location.origin}/members`, environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open portal");
    } finally {
      setBusy(false);
    }
  };

  if (clientSecret) {
    return (
      <div className="min-h-screen">
        <PaymentTestModeBanner />
        <div className="max-w-3xl mx-auto p-6">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-3">Members Club</h1>
        <p className="text-muted-foreground mb-10">
          Exclusive drops, early access, and member-only pricing — cancel anytime.
        </p>

        {authLoading || subLoading ? (
          <p>Loading…</p>
        ) : !user ? (
          <div className="rounded-lg border p-6">
            <p className="mb-4">Sign in to join the Members Club.</p>
            <Link to="/auth"><Button>Sign in</Button></Link>
          </div>
        ) : isActive && subscription ? (
          <div className="rounded-lg border p-6 space-y-3">
            <h2 className="text-2xl font-semibold">You're a member 🎉</h2>
            <p className="text-sm text-muted-foreground">
              Plan: <strong>{subscription.price_id === "members_yearly" ? "Yearly" : "Monthly"}</strong>
              {" · "}Status: <strong>{subscription.status}</strong>
              {subscription.current_period_end && (
                <>
                  {" · "}
                  {subscription.cancel_at_period_end ? "Access until " : "Renews "}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </>
              )}
            </p>
            <Button onClick={manage} disabled={busy}>Manage subscription</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            <PlanCard
              title="Monthly"
              price="£12"
              period="/month"
              onSubscribe={() => subscribe("members_monthly")}
              busy={busy}
            />
            <PlanCard
              title="Yearly"
              price="£120"
              period="/year"
              badge="Save £24"
              onSubscribe={() => subscribe("members_yearly")}
              busy={busy}
              highlighted
            />
          </div>
        )}
      </main>
    </div>
  );
}

function PlanCard({
  title, price, period, badge, onSubscribe, busy, highlighted,
}: {
  title: string;
  price: string;
  period: string;
  badge?: string;
  onSubscribe: () => void;
  busy: boolean;
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-6 ${highlighted ? "border-primary ring-2 ring-primary/20" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        {badge && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{badge}</span>}
      </div>
      <p className="text-3xl font-bold mb-1">{price}<span className="text-base font-normal text-muted-foreground">{period}</span></p>
      <ul className="text-sm text-muted-foreground my-6 space-y-2">
        <li>✓ Early access to drops</li>
        <li>✓ Member-only pricing</li>
        <li>✓ Free shipping on every order</li>
        <li>✓ Cancel anytime</li>
      </ul>
      <Button className="w-full" onClick={onSubscribe} disabled={busy}>
        {busy ? "Loading…" : "Join now"}
      </Button>
    </div>
  );
}
