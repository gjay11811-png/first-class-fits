import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingBag, Heart, User as UserIcon, Menu, X } from "lucide-react";
import { useState } from "react";
import { useScroll, useMotionValueEvent, motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate({ to: "/shop", search: { q: search.trim() } as never });
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const navItems = [
    { to: "/shop", label: "New Arrivals", search: { sort: "new" } },
    { to: "/shop", label: "Footwear", search: { category: "footwear" } },
    { to: "/shop", label: "Apparel", search: { category: "mens-fashion" } },
    { to: "/shop", label: "Tech", search: { category: "electronics" } },
    { to: "/shop", label: "Sale", search: { sale: "1" } },
    { to: "/members", label: "Members", search: {} },
  ];

  return (
    <motion.header
      className="sticky top-0 z-50 border-b transition-colors duration-300"
      animate={{
        backgroundColor: scrolled ? "oklch(0.08 0.005 260 / 0.97)" : "oklch(0.08 0.005 260 / 0)",
        borderColor: scrolled ? "oklch(1 0 0 / 0.08)" : "oklch(1 0 0 / 0)",
        backdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button className="md:hidden p-2 -ml-2" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="size-5" />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="size-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <Link to="/" className="font-serif text-xl sm:text-2xl tracking-tight hover:text-primary transition-colors duration-200">
            First Class Fits
          </Link>
        </div>

        <nav className="hidden md:flex gap-7 text-[11px] font-semibold uppercase tracking-[0.15em]">
          {navItems.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              search={n.search as never}
              className={`relative group hover:text-primary transition-colors duration-200 ${pathname === n.to ? "text-foreground" : "text-foreground/70"}`}
            >
              {n.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button className="p-2 hover:text-primary transition-colors" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}>
            <Search className="size-[18px]" />
          </button>
          <Link to="/wishlist" className="p-2 hover:text-primary transition-colors hidden sm:inline-flex" aria-label="Wishlist">
            <Heart className="size-[18px]" />
          </Link>
          <Link to={user ? "/account" : "/auth"} className="p-2 hover:text-primary transition-colors" aria-label="Account">
            <UserIcon className="size-[18px]" />
          </Link>
          {isAdmin && (
            <Link to="/admin" className="hidden md:inline-flex text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-sm bg-primary text-primary-foreground">
              Admin
            </Link>
          )}
          <button onClick={() => setOpen(true)} className="p-2 hover:text-primary transition-colors relative" aria-label="Cart">
            <ShoppingBag className="size-[18px]" />
            {count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 size-4 grid place-items-center text-[10px] font-bold rounded-full bg-primary text-primary-foreground"
              >
                {count}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-md"
          >
            <form onSubmit={onSearch} className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex gap-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, drops, collections..."
                className="flex-1 bg-transparent border-b border-border focus:border-primary outline-none py-2 text-sm transition-colors"
              />
              <button className="text-[11px] uppercase tracking-widest font-bold text-primary px-3">Search</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-border bg-background/97 backdrop-blur-md"
          >
            <nav className="px-6 py-4 flex flex-col gap-1">
              {navItems.map((n, i) => (
                <motion.div
                  key={n.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={n.to}
                    search={n.search as never}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 text-sm font-semibold uppercase tracking-widest hover:text-primary transition-colors"
                  >
                    {n.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: navItems.length * 0.05, duration: 0.3 }}>
                <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-semibold uppercase tracking-widest hover:text-primary transition-colors">Wishlist</Link>
              </motion.div>
              {isAdmin && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: (navItems.length + 1) * 0.05, duration: 0.3 }}>
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-semibold uppercase tracking-widest text-primary">Admin</Link>
                </motion.div>
              )}
              {user && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: (navItems.length + 2) * 0.05, duration: 0.3 }}>
                  <button onClick={async () => { await supabase.auth.signOut(); setMobileOpen(false); }} className="py-2.5 text-left text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Sign out</button>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
