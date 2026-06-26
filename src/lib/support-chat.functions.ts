import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Customer-support assistant for the storefront.
// Uses Anthropic (Claude) when ANTHROPIC_API_KEY is set; otherwise falls back
// to a keyword FAQ matcher so the widget is useful with zero configuration.

const Input = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

const SYSTEM = `You are the customer-support concierge for First Class Fits (firstclassfits.co), a UK premium store selling fashion, footwear, timepieces and lifestyle tech. Be warm, concise (2-4 sentences), refined and on-brand — never pushy. Use British English and the £ sign. No emojis.

Facts you can rely on:
- Shipping: FREE over £100, otherwise £6.99 standard. UK 2-4 business days, US 3-5. Orders dispatch within 48 hours.
- Returns: free 30-day returns on full-price items in original condition; sale items exchange within 14 days. Electronics and worn footwear are exchange-only.
- Payment: all major credit/debit cards via secure Stripe checkout. Guest checkout is available (no account needed).
- Tracking: a tracking link is emailed when an order ships; signed-in customers can view orders in their account.
- Contact: gjay11811@gmail.com.

Rules:
- You CANNOT look up a specific order, payment or customer account. For anything order-specific (where is my order, refund status, change address), briefly apologise and direct them to email gjay11811@gmail.com with their order number, or to sign in and open the order.
- Never invent stock levels, prices, delivery dates or discount codes. If unsure, say so and point to email.
- Keep replies short.`;

function faqFallback(q: string): string {
  const s = q.toLowerCase();
  if (/(ship|deliver|postage|how long|arrive|dispatch)/.test(s))
    return "Shipping is free on orders over £100, otherwise £6.99 standard. UK orders arrive in 2–4 business days (US 3–5), and we dispatch within 48 hours. For anything specific to your order, email gjay11811@gmail.com.";
  if (/(return|refund|exchange|send back)/.test(s))
    return "We offer free 30-day returns on full-price items in original condition; sale items can be exchanged within 14 days. Electronics and worn footwear are exchange-only. To start a return, sign in and open your order, or email gjay11811@gmail.com.";
  if (/(pay|payment|card|stripe|checkout|klarna|afterpay)/.test(s))
    return "We accept all major credit and debit cards through our secure Stripe checkout, and you can check out as a guest — no account needed.";
  if (/(track|where.*order|order status)/.test(s))
    return "You'll receive a tracking link by email as soon as your order ships, and you can view your orders by signing in. For a specific order, email gjay11811@gmail.com with your order number.";
  if (/(size|sizing|fit|measure)/.test(s))
    return "Sizing details are on each product page. If you're between sizes or unsure, email gjay11811@gmail.com and we'll help — and remember returns are free within 30 days.";
  if (/(contact|email|human|agent|speak|phone)/.test(s))
    return "You can reach our team any time at gjay11811@gmail.com and we'll get back to you quickly.";
  if (/^\s*(hi|hello|hey|yo|hiya)\b/.test(s) || s.length < 4)
    return "Hi — welcome to First Class Fits. I can help with shipping, returns, payment, sizing and order questions. What can I help you with?";
  return "Thanks for your message. I can help with shipping, returns, payment, sizing and orders. For anything specific to your order, email gjay11811@gmail.com and the team will sort it out.";
}

export const askSupport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ reply: string; ai: boolean }> => {
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { reply: faqFallback(lastUser), ai: false };

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.SUPPORT_CHAT_MODEL || "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: SYSTEM,
          messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) return { reply: faqFallback(lastUser), ai: false };
      const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      const text = (json.content ?? [])
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("")
        .trim();
      return { reply: text || faqFallback(lastUser), ai: Boolean(text) };
    } catch {
      return { reply: faqFallback(lastUser), ai: false };
    }
  });
