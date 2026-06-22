import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: productCount }, { count: orderCount }, { data: revenue }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total"),
      ]);
      const totalRevenue = (revenue ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0);
      return { productCount: productCount ?? 0, orderCount: orderCount ?? 0, totalRevenue };
    },
  });

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Products" value={stats.data?.productCount ?? "..."} />
        <Card label="Orders" value={stats.data?.orderCount ?? "..."} />
        <Card label="Revenue" value={formatPrice(stats.data?.totalRevenue ?? 0)} />
      </div>
      <div className="mt-10 border border-border p-6">
        <h2 className="text-[11px] uppercase tracking-widest font-bold mb-3">Quick start</h2>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Go to <strong className="text-foreground">Products</strong> to add or edit items. Use the <strong className="text-foreground">AI Assistant</strong> to auto-generate listings from a product photo.</li>
          <li>• Drag and drop multiple images directly into the upload zone.</li>
          <li>• Mark products as featured / trending / best seller to feature them on the homepage rails.</li>
          <li>• Set a sale price to display the item in the Sale section.</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-4xl mt-2">{value}</p>
    </div>
  );
}
