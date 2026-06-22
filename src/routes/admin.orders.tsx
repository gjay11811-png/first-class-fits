import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"] as const;

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const qc = useQueryClient();
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = async (id: string, status: typeof STATUSES[number]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  return (
    <div>
      <h2 className="font-display text-2xl uppercase tracking-tighter mb-6">Orders</h2>
      <div className="border border-border divide-y divide-border">
        {orders.data?.map((o) => (
          <div key={o.id} className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div>
                <p className="text-sm font-semibold">#{o.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.email}</p>
              </div>
              <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as typeof STATUSES[number])} className="bg-transparent border border-border px-2 py-1 text-[11px] uppercase tracking-widest">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-sm font-bold">{formatPrice(o.total, o.currency)}</span>
            </div>
            <ul className="mt-3 text-xs text-muted-foreground space-y-1">
              {o.order_items?.map((it: { id: string; title: string; quantity: number; unit_price: number }) => (
                <li key={it.id}>{it.quantity}× {it.title} — {formatPrice(it.unit_price)}</li>
              ))}
            </ul>
          </div>
        ))}
        {orders.data?.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No orders yet.</div>}
      </div>
    </div>
  );
}
