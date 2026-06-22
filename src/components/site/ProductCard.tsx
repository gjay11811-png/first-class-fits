import { Link } from "@tanstack/react-router";
import { heroImage, type ProductWithImages } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";

export const productCardVariant = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function ProductCard({ product, badge }: { product: ProductWithImages; badge?: string }) {
  const cart = useCart();
  const { user } = useAuth();
  const img = heroImage(product);
  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const [wishlisted, setWishlisted] = useState(false);

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.sizes && product.sizes.length > 0) {
      window.location.href = `/product/${product.slug}`;
      return;
    }
    cart.add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: Number(onSale ? product.sale_price! : product.price),
      image: img,
      size: null,
    });
    toast.success("Added to cart");
  };

  const wishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Sign in to save items."); return; }
    const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: product.id });
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
    } else {
      setWishlisted(true);
      toast.success("Saved to wishlist");
    }
  };

  return (
    <motion.div variants={productCardVariant}>
      <Link to="/product/$slug" params={{ slug: product.slug }} className="group block">
        <div className="relative aspect-[3/4] bg-surface overflow-hidden">
          {img ? (
            <motion.img
              src={img}
              alt={product.title}
              loading="lazy"
              className="size-full object-cover"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <div className="size-full grid place-items-center text-[10px] text-muted-foreground uppercase tracking-widest">No image</div>
          )}

          {/* Badges */}
          {badge && (
            <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 uppercase tracking-widest z-10">
              {badge}
            </span>
          )}
          {onSale && (
            <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 uppercase tracking-widest z-10">
              Sale
            </span>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Wishlist button */}
          <motion.button
            onClick={wishlist}
            whileTap={{ scale: 0.85 }}
            className="absolute bottom-3 right-3 size-9 grid place-items-center bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200 z-10"
            aria-label="Save to wishlist"
          >
            <Heart className={`size-4 transition-all duration-200 ${wishlisted ? "fill-primary text-primary" : ""}`} />
          </motion.button>

          {/* Quick add */}
          <motion.button
            onClick={quickAdd}
            className="absolute inset-x-3 bottom-3 mr-14 py-2.5 bg-foreground text-background flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest z-10"
            initial={{ y: 12, opacity: 0 }}
            whileHover={{ y: 0, opacity: 1 }}
            animate={{ y: 12, opacity: 0 }}
            whileFocus={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ShoppingBag className="size-3.5" />
            Quick add
          </motion.button>

          {/* Glow border on hover */}
          <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/30 transition-all duration-300 pointer-events-none" />
        </div>

        <div className="pt-4">
          {product.brand && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1.5">{product.brand}</p>
          )}
          <h3 className="font-serif text-base leading-snug group-hover:text-primary transition-colors duration-300">
            {product.title}
          </h3>
          <div className="text-sm mt-2 flex items-baseline gap-2">
            {onSale ? (
              <>
                <span className="text-foreground font-medium">{formatPrice(product.sale_price!, product.currency)}</span>
                <span className="line-through text-xs text-muted-foreground">{formatPrice(product.price, product.currency)}</span>
              </>
            ) : (
              <span className="text-foreground/90">{formatPrice(product.price, product.currency)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
