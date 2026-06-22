import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — First Class Fits" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, user, loading } = useIsAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && user === null) navigate({ to: "/auth", search: { redirect: "/admin" } as never });
  }, [loading, user, navigate]);

  if (loading || !user) return <div className="py-20 text-center text-sm text-muted-foreground">Checking access...</div>;
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6 text-center">
        <h1 className="font-display text-3xl uppercase tracking-tighter">Admin only</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account isn't marked as admin yet. Run this in your database to promote yourself:
        </p>
        <pre className="mt-4 text-left text-xs bg-surface p-4 overflow-x-auto border border-border">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${user.id}', 'admin');`}
        </pre>
        <p className="mt-3 text-xs text-muted-foreground">Then refresh this page.</p>
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: "Overview" },
    { to: "/admin/products", label: "Products" },
    { to: "/admin/orders", label: "Orders" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
          <h1 className="font-display text-3xl uppercase tracking-tighter">Store</h1>
        </div>
        <Link to="/" className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary">View site →</Link>
      </div>
      <div className="grid md:grid-cols-[200px_1fr] gap-8">
        <aside className="space-y-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={`block px-3 py-2 text-sm uppercase tracking-widest ${pathname === n.to ? "bg-primary text-primary-foreground font-bold" : "hover:bg-surface"}`}>
              {n.label}
            </Link>
          ))}
        </aside>
        <section><Outlet /></section>
      </div>
    </div>
  );
}
