import { supabase } from "@/integrations/supabase/client";

export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  seo_description: string | null;
  meta_tags: string[] | null;
  features: string[] | null;
  specifications: Record<string, string> | null;
  price: number;
  sale_price: number | null;
  currency: string;
  inventory: number;
  category_id: string | null;
  tags: string[] | null;
  collections: string[] | null;
  brand: string | null;
  sizes: string[] | null;
  gender: "mens" | "womens" | "unisex" | "kids";
  status: "draft" | "active" | "archived";
  is_featured: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
  created_at: string;
};
export type ProductImage = { id: string; product_id: string; url: string; alt: string | null; sort_order: number };
export type ProductColor = { id: string; product_id: string; name: string; hex: string; image_url: string | null; images: string[]; sort_order: number };
export type ProductWithImages = ProductRow & { product_images: ProductImage[]; product_colors?: ProductColor[] };
export type Category = { id: string; slug: string; name: string; description: string | null; sort_order: number };

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("brand")
    .eq("status", "active")
    .not("brand", "is", null);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of (data ?? []) as { brand: string | null }[]) {
    const b = (r.brand ?? "").trim();
    if (b) set.add(b);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function fetchProducts(opts: {
  category?: string | null;
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  saleOnly?: boolean;
  search?: string;
  brand?: string | null;
  limit?: number;
} = {}): Promise<ProductWithImages[]> {
  let q = supabase.from("products").select("*, product_images(*), product_colors(*)").eq("status", "active");
  if (opts.category) {
    // Special "gender" categories aggregate across all sub-categories automatically.
    if (opts.category === "mens-fashion") {
      q = q.in("gender", ["mens", "unisex"]);
    } else if (opts.category === "womens-fashion") {
      q = q.in("gender", ["womens", "unisex"]);
    } else if (opts.category === "kids") {
      q = q.eq("gender", "kids");
    } else {
      const { data: cat } = await supabase.from("categories").select("id").eq("slug", opts.category).maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }
  }
  if (opts.brand) q = q.eq("brand", opts.brand);
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.trending) q = q.eq("is_trending", true);
  if (opts.bestSeller) q = q.eq("is_best_seller", true);
  if (opts.saleOnly) q = q.not("sale_price", "is", null);
  if (opts.search) q = q.ilike("title", `%${opts.search}%`);
  if (opts.limit) q = q.limit(opts.limit);
  q = q.order("created_at", { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ProductWithImages[];
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithImages | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_colors(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ProductWithImages | null;
}

export async function fetchReviews(productId: string) {
  const { data, error } = await supabase
    .from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function heroImage(p: ProductWithImages) {
  const sorted = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0]?.url ?? "";
}
