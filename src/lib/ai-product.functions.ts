import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type GenerateInput = { imageUrl: string; hint?: string };

const SYSTEM = `You are a senior ecommerce copywriter for a premium fashion + lifestyle store called First Class Fits.
Given a product image, produce a polished JSON listing. Be specific, concise, conversion-focused. No emojis.`;

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short premium product title, 2-5 words" },
    description: { type: "string", description: "2-3 sentence description, evocative and concrete" },
    seo_description: { type: "string", description: "Meta description under 160 chars" },
    features: { type: "array", items: { type: "string" }, description: "4-6 short feature bullets" },
    specifications: { type: "object", additionalProperties: { type: "string" } },
    meta_tags: { type: "array", items: { type: "string" }, description: "6-10 SEO keywords" },
    suggested_price: { type: "number", description: "Suggested retail price in USD" },
    suggested_category: { type: "string", description: "One of: mens-fashion, womens-fashion, sportswear, footwear, accessories, electronics" },
  },
  required: ["title", "description", "seo_description", "features", "meta_tags", "suggested_price", "suggested_category"],
  additionalProperties: false,
};

export const generateProductListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: GenerateInput) => {
    if (!data?.imageUrl || typeof data.imageUrl !== "string") throw new Error("imageUrl required");
    return data;
  })
  .handler(async ({ data, context }) => {
    // Admin gate
    const { data: roleRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const userPrompt = `Analyse this product image and generate the full listing.${data.hint ? ` Additional context: ${data.hint}` : ""}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: data.imageUrl } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_product_listing",
            description: "Return the structured product listing",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "create_product_listing" } },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
      throw new Error(`AI error: ${text.slice(0, 200)}`);
    }
    const json = await res.json() as { choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }> };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no structured output");
    let parsed: ProductListingResult;
    try { parsed = JSON.parse(args); }
    catch { throw new Error("AI returned invalid JSON"); }
    return parsed;
  });

export type ProductListingResult = {
  title: string;
  description: string;
  seo_description: string;
  features: string[];
  specifications?: Record<string, string>;
  meta_tags: string[];
  suggested_price: number;
  suggested_category: string;
};
