import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type StripeEnv = "sandbox" | "live";

// Stripe publishable key — safe to expose (it ships in the browser bundle by
// design). Hardcoded as a fallback so live checkout always renders even if the
// host's build-time env var is missing.
const FALLBACK_PUBLISHABLE_KEY =
  "pk_live_51ThXYq5E0PQ1JYEv8JmR8rMZwoWcxcnQzXJg77tw9kVG3A0mk8wIQorLHL7wyPJUabex7bzr5U32xvyfOCoGo1rj00B2PrYxv6";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN || FALLBACK_PUBLISHABLE_KEY;

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Payments are not configured for this build. Complete go-live in your Lovable project to enable production checkout.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}
