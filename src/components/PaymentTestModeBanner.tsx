// Mirror the resolved publishable key (env var, then hardcoded live fallback)
// so this banner reflects the same key checkout actually uses.
const FALLBACK_PUBLISHABLE_KEY =
  "pk_live_51ThXYq5E0PQ1JYEv8JmR8rMZwoWcxcnQzXJg77tw9kVG3A0mk8wIQorLHL7wyPJUabex7bzr5U32xvyfOCoGo1rj00B2PrYxv6";

const clientToken =
  import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN || FALLBACK_PUBLISHABLE_KEY;

export function PaymentTestModeBanner() {
  // Live mode (or any real key): no banner.
  if (clientToken.startsWith("pk_live_")) {
    return null;
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
        Test mode — no real payments are taken.
      </div>
    );
  }
  return (
    <div className="w-full bg-red-100 border-b border-red-300 px-4 py-2 text-center text-sm text-red-800">
      Payments are temporarily unavailable. Please contact support to complete your order.
    </div>
  );
}
