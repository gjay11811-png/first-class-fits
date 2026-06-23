import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { isAllowedReturnUrl } from "@/lib/safe-return-url";
import { z } from "zod";

// Server-side anonymous Supabase client (publishable key only) — used by the
// guest checkout path to read public product data without a logged-in session.
// Never bypasses RLS; only reads what the storefront can already read publicly.
const GUEST_SUPABASE_URL = process.env.SUPABASE_URL || "https://czwcmzixsqknaaaeljih.supabase.co";
const GUEST_SUPABASE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_9u2gprjS6ebTn4c4yAj1Rg_O_vGe-vR";
function anonSupabase() {
  return createClient(GUEST_SUPABASE_URL, GUEST_SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const Input = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  email: z.string().email(),
  shipping_address: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    city: z.string().min(1),
    postal: z.string().min(1),
    country: z.string().min(1),
  }),
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]),
});

type CheckoutResult = { clientSecret: string; orderId: string } | { error: string };

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { supabase, userId } = context;
    const env: StripeEnv = data.environment;
    if (!isAllowedReturnUrl(data.returnUrl)) return { error: "Invalid return URL" };


    try {
      const ids = data.items.map((i) => i.productId);
      const { data: products, error } = await supabase
        .from("products")
        .select("id, title, price, sale_price, currency, inventory, product_images(url, sort_order)")
        .in("id", ids);
      if (error) throw new Error(error.message);
      if (!products || products.length === 0) throw new Error("No products found");

      const lines = data.items.map((i) => {
        const p = products.find((x) => x.id === i.productId);
        if (!p) throw new Error("Product not found: " + i.productId);
        if (p.inventory < i.quantity) throw new Error(`Only ${p.inventory} of ${p.title} in stock`);
        const unit = Number(p.sale_price ?? p.price);
        const image = (p.product_images ?? [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0]
          ?.url as string | undefined;
        return { p, qty: i.quantity, unit, image };
      });

      const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
      const shipping = subtotal >= 100 ? 0 : 6.99;
      const total = subtotal + shipping;
      const currency = "gbp";

      // Create pending order in DB
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          email: data.email,
          subtotal,
          shipping,
          tax: 0,
          total,
          currency: "GBP",
          shipping_address: data.shipping_address,
          status: "pending",
        })
        .select("id")
        .single();
      if (orderErr || !order) throw new Error(orderErr?.message ?? "Could not create order");

      const { error: itemsErr } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.p.id,
          title: l.p.title,
          unit_price: l.unit,
          quantity: l.qty,
          image_url: l.image ?? null,
        })),
      );
      if (itemsErr) throw new Error(itemsErr.message);

      const stripe = createStripeClient(env);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer_email: data.email,
        client_reference_id: order.id,
        metadata: { order_id: order.id, user_id: userId },
        line_items: [
          ...lines.map((l) => ({
            quantity: l.qty,
            price_data: {
              currency,
              unit_amount: Math.round(l.unit * 100),
              product_data: {
                name: l.p.title,
                ...(l.image && { images: [l.image] }),
              },
            },
          })),
          ...(shipping > 0
            ? [{
                quantity: 1,
                price_data: {
                  currency,
                  unit_amount: Math.round(shipping * 100),
                  product_data: { name: "Standard shipping" },
                },
              }]
            : []),
        ],
        payment_intent_data: {
          description: `Order ${order.id.slice(0, 8).toUpperCase()}`,
          metadata: { order_id: order.id, user_id: userId },
        },
      });

      await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

      return { clientSecret: session.client_secret ?? "", orderId: order.id };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ sessionId: z.string().min(1), environment: z.enum(["sandbox", "live"]) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ status: string; orderId?: string }> => {
    const { supabase } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();
    if (!order) return { status: "unknown" };
    if (order.status === "paid") return { status: "paid", orderId: order.id };

    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      if (session.payment_status === "paid") {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", order.id);
        return { status: "paid", orderId: order.id };
      }
      return { status: order.status, orderId: order.id };
    } catch {
      return { status: order.status, orderId: order.id };
    }
  });

// ── Guest checkout ──────────────────────────────────────────────────────────
// No login required. Prices are validated server-side from public product data
// (so they can't be tampered with), then a Stripe Checkout session is created.
// Stripe itself is the record of the order — view guest orders in your Stripe
// Dashboard. No database write, so this works without the service-role key.
const GuestInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  email: z.string().email(),
  shipping_address: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    city: z.string().min(1),
    postal: z.string().min(1),
    country: z.string().min(1),
  }),
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]),
});

export const createGuestCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => GuestInput.parse(d))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const env: StripeEnv = data.environment;
    if (!isAllowedReturnUrl(data.returnUrl)) return { error: "Invalid return URL" };

    try {
      const supabase = anonSupabase();
      const ids = data.items.map((i) => i.productId);
      const { data: products, error } = await supabase
        .from("products")
        .select("id, title, price, sale_price, inventory, product_images(url, sort_order)")
        .in("id", ids);
      if (error) throw new Error(error.message);
      if (!products || products.length === 0) throw new Error("No products found");

      const lines = data.items.map((i) => {
        const p = products.find((x) => x.id === i.productId);
        if (!p) throw new Error("Product not found: " + i.productId);
        if (p.inventory < i.quantity) throw new Error(`Only ${p.inventory} of ${p.title} in stock`);
        const unit = Number(p.sale_price ?? p.price);
        const image = (p.product_images ?? [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0]
          ?.url as string | undefined;
        return { p, qty: i.quantity, unit, image };
      });

      const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
      const shipping = subtotal >= 100 ? 0 : 6.99;
      const currency = "gbp";

      const stripe = createStripeClient(env);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer_email: data.email,
        metadata: {
          guest: "1",
          shipping_address: JSON.stringify(data.shipping_address).slice(0, 480),
        },
        line_items: [
          ...lines.map((l) => ({
            quantity: l.qty,
            price_data: {
              currency,
              unit_amount: Math.round(l.unit * 100),
              product_data: {
                name: l.p.title,
                ...(l.image && { images: [l.image] }),
              },
            },
          })),
          ...(shipping > 0
            ? [{
                quantity: 1,
                price_data: {
                  currency,
                  unit_amount: Math.round(shipping * 100),
                  product_data: { name: "Standard shipping" },
                },
              }]
            : []),
        ],
        payment_intent_data: {
          description: `Guest order — ${data.email}`,
          metadata: { guest: "1" },
        },
      });

      return { clientSecret: session.client_secret ?? "", orderId: session.id };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export type GuestOrderSummary =
  | { found: false }
  | {
      found: true;
      email: string;
      paymentStatus: string;
      currency: string;
      subtotal: number;
      shipping: number;
      total: number;
      items: { name: string; quantity: number; amount: number }[];
      shippingAddress: { name?: string; line1?: string; city?: string; postal?: string; country?: string } | null;
      sessionId: string;
    };

export const getGuestCheckoutSummary = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ sessionId: z.string().min(1), environment: z.enum(["sandbox", "live"]) }).parse(d),
  )
  .handler(async ({ data }): Promise<GuestOrderSummary> => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
        expand: ["line_items"],
      });
      const lineItems = session.line_items?.data ?? [];
      const shipLine = lineItems.find((li) => li.description === "Standard shipping");
      const shipping = shipLine?.amount_total ?? 0;
      const items = lineItems
        .filter((li) => li.description !== "Standard shipping")
        .map((li) => ({
          name: li.description ?? "Item",
          quantity: li.quantity ?? 1,
          amount: li.amount_total ?? 0,
        }));
      const total = session.amount_total ?? 0;
      let shippingAddress:
        | { name?: string; line1?: string; city?: string; postal?: string; country?: string }
        | null = null;
      try {
        shippingAddress = session.metadata?.shipping_address
          ? JSON.parse(session.metadata.shipping_address)
          : null;
      } catch {
        shippingAddress = null;
      }
      return {
        found: true,
        email: session.customer_email ?? session.customer_details?.email ?? "",
        paymentStatus: session.payment_status ?? "unpaid",
        currency: (session.currency ?? "gbp").toUpperCase(),
        subtotal: total - shipping,
        shipping,
        total,
        items,
        shippingAddress,
        sessionId: session.id,
      };
    } catch {
      return { found: false };
    }
  });
