import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useEffect } from "react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — First Class Fits" },
      { name: "description", content: "Sign in to your First Class Fits account to track orders, manage your wishlist and access members-only drops." },
      { property: "og:title", content: "My account — First Class Fits" },
      { property: "og:description", content: "Track orders, manage your wishlist and access members-only drops at First Class Fits." },
      { property: "og:url", content: "https://firstclassfits.co/account" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://firstclassfits.co/account" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!user) return <div className="py-20 text-center text-sm text-muted-foreground">Redirecting...</div>;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Account</p>
          <h1 className="font-display text-4xl uppercase tracking-tighter">{user.user_metadata?.full_name ?? user.email}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/wishlist" className="border border-border px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:border-primary">Wishlist</Link>
          {isAdmin && <Link to="/admin" className="bg-primary text-primary-foreground px-4 py-2 text-[11px] font-bold uppercase tracking-widest">Admin</Link>}
          <button onClick={() => supabase.auth.signOut()} className="border border-border px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:border-destructive">Sign out</button>
        </div>
      </div>

      <h2 className="text-[11px] uppercase tracking-widest font-bold mb-4">Orders</h2>
      {orders.isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : orders.data && orders.data.length > 0 ? (
        <div className="divide-y divide-border border-y border-border">
          {orders.data.map((o) => (
            <div key={o.id} className="py-5 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-tight">Order #{o.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString()} · {o.order_items?.length ?? 0} items</p>
              </div>
              <div className="text-sm"><span className="px-2 py-1 text-[10px] uppercase tracking-widest font-bold border border-border">{o.status}</span></div>
              <div className="text-sm font-bold">{formatPrice(o.total, o.currency)}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No orders yet. <Link to="/shop" className="text-primary uppercase tracking-widest font-bold">Start shopping →</Link></p>
      )}
    </div>
  );
}
