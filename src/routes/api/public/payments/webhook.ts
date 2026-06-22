import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function handleCheckoutCompleted(session: Record<string, unknown>) {
  const metadata = (session.metadata ?? {}) as { order_id?: string; user_id?: string };
  const orderId = metadata.order_id ?? (session.client_reference_id as string | undefined);
  const paymentStatus = session.payment_status as string | undefined;
  if (!orderId) return;
  if (paymentStatus && paymentStatus !== "paid") return;

  const supabaseAdmin = await getAdmin();

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status === "paid") return;

  const paymentIntentId = session.payment_intent as string | undefined;
  await supabaseAdmin
    .from("orders")
    .update({ status: "paid", stripe_payment_intent_id: paymentIntentId ?? null })
    .eq("id", orderId);

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_id, quantity, unit_price, title")
    .eq("order_id", orderId);
  for (const it of items ?? []) {
    if (!it.product_id) continue;
    const { data: p } = await supabaseAdmin
      .from("products")
      .select("inventory")
      .eq("id", it.product_id)
      .maybeSingle();
    if (p) {
      const next = Math.max(0, (p.inventory ?? 0) - it.quantity);
      await supabaseAdmin.from("products").update({ inventory: next }).eq("id", it.product_id);
    }
  }

  // Create shipment record (one per order)
  await supabaseAdmin
    .from("shipments")
    .insert({ order_id: orderId, status: "processing" })
    .select("id")
    .maybeSingle();

  // Send order confirmation email (non-blocking on failure)
  try {
    const { data: full } = await supabaseAdmin
      .from("orders")
      .select("email, subtotal, shipping, total, currency, shipping_address")
      .eq("id", orderId)
      .maybeSingle();
    if (full?.email) {
      const fmt = (n: number) => `${(full.currency ?? "GBP") === "GBP" ? "£" : ""}${(n / 100).toFixed(2)}`;
      const addr = full.shipping_address as Record<string, any> | null;
      const addrStr = addr ? [addr.name, addr.line1, addr.line2, addr.city, addr.postal_code, addr.country].filter(Boolean).join(", ") : "";
      const { sendInternalEmail } = await import("@/lib/email/send-internal.server");
      await sendInternalEmail({
        templateName: "order-confirmation",
        recipientEmail: full.email,
        idempotencyKey: `order-confirm-${orderId}`,
        templateData: {
          customerName: (addr?.name as string) ?? "",
          orderNumber: orderId.slice(0, 8).toUpperCase(),
          items: (items ?? []).map((i: any) => ({
            name: i.title ?? "Item",
            qty: i.quantity,
            price: fmt((i.unit_price ?? 0) * i.quantity),
          })),
          subtotal: fmt(full.subtotal ?? 0),
          shipping: fmt(full.shipping ?? 0),
          total: fmt(full.total ?? 0),
          shippingAddress: addrStr,
        },
      });
    }
  } catch (e) {
    console.error("Order confirmation email failed", e);
  }
}

async function handleChargeRefunded(charge: Record<string, unknown>) {
  const paymentIntentId = charge.payment_intent as string | undefined;
  if (!paymentIntentId) return;
  const supabaseAdmin = await getAdmin();

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (!order || order.status === "refunded") return;

  await supabaseAdmin
    .from("orders")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", order.id);

  // Restock inventory
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", order.id);
  for (const it of items ?? []) {
    if (!it.product_id) continue;
    const { data: p } = await supabaseAdmin
      .from("products")
      .select("inventory")
      .eq("id", it.product_id)
      .maybeSingle();
    if (p) {
      await supabaseAdmin
        .from("products")
        .update({ inventory: (p.inventory ?? 0) + it.quantity })
        .eq("id", it.product_id);
    }
  }
}

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_start?: number;
  current_period_end?: number;
  metadata?: { userId?: string };
  items?: { data?: Array<{ price?: { id?: string; lookup_key?: string; product?: string; metadata?: { lovable_external_id?: string } }; current_period_start?: number; current_period_end?: number }> };
};

async function upsertSubscription(sub: StripeSubscription, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error("subscription event without userId metadata", sub.id);
    return;
  }
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id || "";
  const productId = item?.price?.product || "";
  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;

  const supabaseAdmin = await getAdmin();
  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer,
      product_id: productId,
      price_id: priceId,
      status: sub.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function markSubscriptionCanceled(sub: StripeSubscription, env: StripeEnv) {
  const supabaseAdmin = await getAdmin();
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded":
              await handleCheckoutCompleted(event.data.object);
              break;
            case "charge.refunded":
            case "charge.refund.updated":
              await handleChargeRefunded(event.data.object);
              break;
            case "customer.subscription.created":
            case "customer.subscription.updated":
              await upsertSubscription(event.data.object as unknown as StripeSubscription, env);
              break;
            case "customer.subscription.deleted":
              await markSubscriptionCanceled(event.data.object as unknown as StripeSubscription, env);
              break;
            default:
              console.log("Unhandled event:", event.type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
