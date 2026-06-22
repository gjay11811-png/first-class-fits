import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/site/ProductCard";
import { useEffect } from "react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — First Class Fits" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/wishlist" } as never }); }, [loading, user, navigate]);

  const wishlist = useQuery({
    queryKey: ["wishlist", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlists").select("product:products(*, product_images(*))");
      if (error) throw error;
      return (data ?? []).map((r: { product: unknown }) => r.product).filter(Boolean);
    },
  });

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <h1 className="font-display text-4xl uppercase tracking-tighter mb-10">Wishlist</h1>
      {wishlist.data && wishlist.data.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
          {wishlist.data.map((p) => <ProductCard key={(p as { id: string }).id} product={p as Parameters<typeof ProductCard>[0]["product"]} />)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing saved yet. <Link to="/shop" className="text-primary uppercase tracking-widest font-bold">Browse the shop →</Link></p>
      )}
    </div>
  );
}
