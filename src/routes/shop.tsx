import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchBrands, fetchCategories, fetchProducts } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { useIsAdmin } from "@/hooks/use-auth";
import { Plus } from "lucide-react";
import { z } from "zod";


const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  sale: z.string().optional(),
  sort: z.string().optional(),
  brand: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Shop all — Premium apparel, footwear & tech | First Class Fits" },
      { name: "description", content: "Shop the full First Class Fits collection: technical apparel, premium footwear, electronics and accessories. New drops every Friday with free UK shipping over £120." },
      { property: "og:title", content: "Shop the full collection — First Class Fits" },
      { property: "og:description", content: "Technical apparel, premium footwear, lifestyle electronics and limited drops — curated weekly." },
      { property: "og:url", content: "https://firstclassfits.co/shop" },
    ],
    links: [{ rel: "canonical", href: "https://firstclassfits.co/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { category, q, sale, brand } = Route.useSearch();
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const brands = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const products = useQuery({
    queryKey: ["products", { category, q, sale, brand }],
    queryFn: () => fetchProducts({ category, search: q, saleOnly: sale === "1", brand }),
  });

  const active = categories.data?.find((c) => c.slug === category);
  const { isAdmin } = useIsAdmin();
  const addSlug = category ?? "all";
  const addLabel = active?.name ?? (sale === "1" ? "Sale" : brand ?? "All Products");

  const AddButton = ({ className = "" }: { className?: string }) => (
    <Link
      to="/admin/products"
      search={{ new: addSlug } as never}
      className={`inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 text-[11px] font-bold uppercase tracking-widest hover:opacity-90 ${className}`}
    >
      <Plus className="size-3" /> Add item to {addLabel}
    </Link>
  );

  const heading = brand
    ? brand
    : q
    ? `"${q}"`
    : active?.name ?? (sale === "1" ? "Sale Items" : "All Products");

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
          {brand ? "Brand" : "Shop"}
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-tighter">{heading}</h1>
          {isAdmin && <AddButton />}
        </div>
        {active?.description && <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{active.description}</p>}
      </header>

      <div className="grid md:grid-cols-[220px_1fr] gap-10">
        <aside className="space-y-6">
          <div>
            <h3 className="text-[11px] uppercase tracking-widest font-bold mb-3">Category</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className={`hover:text-primary ${!category && !brand ? "text-primary" : "text-muted-foreground"}`}>All</Link></li>
              {categories.data?.map((c) => (
                <li key={c.id}>
                  <Link to="/shop" search={{ category: c.slug } as never} className={`hover:text-primary ${category === c.slug ? "text-primary" : "text-muted-foreground"}`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {brands.data && brands.data.length > 0 && (
            <div>
              <h3 className="text-[11px] uppercase tracking-widest font-bold mb-3">Brand</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/shop" className={`hover:text-primary ${!brand ? "text-primary" : "text-muted-foreground"}`}>All brands</Link></li>
                {brands.data.map((b) => (
                  <li key={b}>
                    <Link to="/shop" search={{ brand: b } as never} className={`hover:text-primary ${brand === b ? "text-primary" : "text-muted-foreground"}`}>
                      {b}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-[11px] uppercase tracking-widest font-bold mb-3">Quick filter</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" search={{ sale: "1" } as never} className={`hover:text-primary ${sale === "1" ? "text-primary" : "text-muted-foreground"}`}>On sale</Link></li>
            </ul>
          </div>
        </aside>

        <section>
          {products.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-surface animate-pulse" />)}
            </div>
          ) : products.data && products.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
              {products.data.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-muted-foreground">No products match your filters.</div>
          )}
          {isAdmin && (
            <div className="mt-10 flex justify-center">
              <AddButton />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
