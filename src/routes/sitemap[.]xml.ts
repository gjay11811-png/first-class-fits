import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createServerFn } from "@tanstack/react-start";

const BASE_URL = "https://www.firstclassfits.co";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const getDynamicEntries = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [products, categories] = await Promise.all([
    supabaseAdmin.from("products").select("slug, updated_at").eq("status", "active"),
    supabaseAdmin.from("categories").select("slug"),
  ]);
  return {
    products: products.data ?? [],
    categories: categories.data ?? [],
  };
});

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let dynamic: { products: Array<{ slug: string; updated_at: string }>; categories: Array<{ slug: string }> } = {
          products: [],
          categories: [],
        };
        try {
          dynamic = await getDynamicEntries();
        } catch {
          // fall through with empty dynamic entries
        }

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
          { path: "/faq", changefreq: "monthly", priority: "0.4" },
          { path: "/shipping", changefreq: "monthly", priority: "0.4" },
          { path: "/returns", changefreq: "monthly", priority: "0.4" },
          ...dynamic.categories.map((c) => ({
            path: `/shop?category=${encodeURIComponent(c.slug)}`,
            changefreq: "weekly" as const,
            priority: "0.7",
          })),
          ...dynamic.products.map((p) => ({
            path: `/product/${p.slug}`,
            lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
