import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Crown, Check, ArrowRight } from "lucide-react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/useSubscription";
import { createSubscriptionCheckout, createMembersPortalSession } from "@/lib/subscriptions.functions";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

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

const PERKS = ["Early access", "Member pricing", "Free shipping", "First-class support", "Exclusive drops", "Cancel anytime"];

// Headline that animates each character in a floating wave.
function AnimatedHeading({ text }: { text: string }) {
  return (
    <h1 className="font-display text-5xl sm:text-7xl md:text-8xl uppercase tracking-tighter leading-[0.9] text-gold-gradient">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex flex-wrap">
        {text.split("").map((char, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{
              opacity: 1,
              y: [0, -10, 0],
              filter: "blur(0px)",
            }}
            transition={{
              opacity: { duration: 0.5, delay: i * 0.06 },
              filter: { duration: 0.5, delay: i * 0.06 },
              y: { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 },
            }}
          >
            {char === " " ? " " : char}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}

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
    <div className="relative min-h-screen overflow-hidden">
      <PaymentTestModeBanner />

      {/* Ambient animated gold glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(ellipse, oklch(0.80 0.085 84 / 0.10) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 sm:py-28">
        {/* Eyebrow */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="w-8 h-px bg-primary" />
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-primary">
            <Crown className="size-3.5" /> Membership
          </span>
          <span className="w-8 h-px bg-primary" />
        </motion.div>

        <div className="text-center">
          <AnimatedHeading text="Members Club" />
        </div>

        <motion.p
          className="mt-6 text-center text-base sm:text-lg text-foreground/70 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          Exclusive drops, early access, and member-only pricing — cancel anytime.
        </motion.p>

        {/* Perks marquee */}
        <div className="relative mt-10 mb-14 flex overflow-hidden border-y border-border py-4">
          <div className="flex shrink-0 items-center animate-marquee whitespace-nowrap">
            {[...PERKS, ...PERKS, ...PERKS].map((p, i) => (
              <span key={i} className="flex items-center gap-3 px-8 text-[11px] uppercase tracking-[0.25em] text-foreground/55">
                <span className="size-1 rounded-full bg-primary" /> {p}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
        </div>

        {authLoading || subLoading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <motion.div
            className="mx-auto max-w-md border border-border bg-surface/40 p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <p className="text-sm text-muted-foreground mb-5">Sign in to join the Members Club.</p>
            <Link
              to="/auth"
              search={{ redirect: "/members" } as never}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground py-3 px-8 text-[11px] font-bold uppercase tracking-widest hover:brightness-110"
            >
              Sign in <ArrowRight className="size-3.5" />
            </Link>
          </motion.div>
        ) : isActive && subscription ? (
          <motion.div
            className="mx-auto max-w-md border border-primary/40 bg-surface/40 p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Crown className="size-7 text-primary mx-auto mb-3" strokeWidth={1.5} />
            <h2 className="font-display text-2xl uppercase tracking-tight mb-2">You're a member</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Plan: <strong className="text-foreground">{subscription.price_id === "members_yearly" ? "Yearly" : "Monthly"}</strong>
              {" · "}Status: <strong className="text-foreground">{subscription.status}</strong>
              {subscription.current_period_end && (
                <>
                  {" · "}
                  {subscription.cancel_at_period_end ? "Access until " : "Renews "}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </>
              )}
            </p>
            <button
              onClick={manage}
              disabled={busy}
              className="bg-primary text-primary-foreground py-3 px-8 text-[11px] font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Loading…" : "Manage subscription"}
            </button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            <PlanCard
              title="Monthly"
              price="£12"
              period="/month"
              onSubscribe={() => subscribe("members_monthly")}
              busy={busy}
              delay={0.5}
            />
            <PlanCard
              title="Yearly"
              price="£120"
              period="/year"
              badge="Save £24"
              onSubscribe={() => subscribe("members_yearly")}
              busy={busy}
              highlighted
              delay={0.6}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function PlanCard({
  title, price, period, badge, onSubscribe, busy, highlighted, delay = 0,
}: {
  title: string;
  price: string;
  period: string;
  badge?: string;
  onSubscribe: () => void;
  busy: boolean;
  highlighted?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className={`relative border p-8 bg-surface/40 transition-colors ${highlighted ? "border-primary" : "border-border hover:border-primary/40"}`}
    >
      {highlighted && (
        <motion.div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{ boxShadow: "0 0 40px oklch(0.80 0.085 84 / 0.18)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl uppercase tracking-tight">{title}</h3>
        {badge && <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary px-2 py-1">{badge}</span>}
      </div>
      <p className="font-display text-5xl tracking-tighter mb-1">
        {price}<span className="text-base font-normal text-muted-foreground tracking-normal">{period}</span>
      </p>
      <ul className="text-sm text-muted-foreground my-7 space-y-2.5">
        <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Early access to drops</li>
        <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Member-only pricing</li>
        <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Free shipping on every order</li>
        <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Cancel anytime</li>
      </ul>
      <button
        onClick={onSubscribe}
        disabled={busy}
        className="w-full bg-primary text-primary-foreground py-3.5 text-[11px] font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
      >
        {busy ? "Loading…" : "Join now"}
      </button>
    </motion.div>
  );
}
