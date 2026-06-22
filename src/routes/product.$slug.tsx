import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProductBySlug, fetchProducts, fetchReviews, heroImage } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/site/ProductCard";
import { Heart, Star, Truck, ShieldCheck, RefreshCw, Camera } from "lucide-react";
import { useState } from "react";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductPhotosModal } from "@/components/admin/ProductPhotosModal";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await fetchProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.title} — First Class Fits` : "Product — First Class Fits";
    const desc = p?.seo_description || p?.description || "Premium product from First Class Fits.";
    const img = p ? p.product_images?.[0]?.url : undefined;
    const url = `https://firstclassfits.co/product/${params.slug}`;
    const onSale = p?.sale_price != null && Number(p.sale_price) < Number(p.price);
    const priceVal = p ? Number(onSale ? p.sale_price! : p.price) : null;
    return {
      meta: [
        { title },
        { name: "description", content: desc.slice(0, 160) },
        { property: "og:title", content: title },
        { property: "og:description", content: desc.slice(0, 160) },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p && priceVal != null ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.title,
          description: desc.slice(0, 5000),
          image: (p.product_images ?? []).map((i: { url: string }) => i.url).filter(Boolean),
          sku: p.id,
          brand: { "@type": "Brand", name: "First Class Fits" },
          offers: {
            "@type": "Offer",
            url,
            price: priceVal.toFixed(2),
            priceCurrency: "GBP",
            availability: (p.inventory ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }),
      }] : [],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-center">
        <h1 className="font-display text-4xl mb-3">Product not found</h1>
        <Link to="/shop" className="text-primary text-sm uppercase tracking-widest">Back to shop</Link>
      </div>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { product } = Route.useLoaderData();
  const cart = useCart();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const router = useRouter();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [activeColorId, setActiveColorId] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [managingPhotos, setManagingPhotos] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.changedTouches[0].screenX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const endX = e.changedTouches[0].screenX;
    const diff = touchStartX - endX;
    const threshold = 50;
    if (diff > threshold && activeImg < gallery.length - 1) {
      setActiveImg((i) => i + 1);
    } else if (diff < -threshold && activeImg > 0) {
      setActiveImg((i) => i - 1);
    }
    setTouchStartX(null);
  };

  const related = useQuery({
    queryKey: ["related", product.category_id],
    queryFn: async () => {
      if (!product.category_id) return [];
      const all = await fetchProducts({ limit: 5 });
      return all.filter((p) => p.id !== product.id).slice(0, 4);
    },
  });

  const reviews = useQuery({ queryKey: ["reviews", product.id], queryFn: () => fetchReviews(product.id) });

  const baseImages = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const colors = [...(product.product_colors ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const sizes: string[] = Array.isArray(product.sizes) ? product.sizes : [];
  const activeColor = colors.find((c) => c.id === activeColorId) ?? null;
  const colorImages: string[] = activeColor
    ? ((Array.isArray(activeColor.images) && activeColor.images.length > 0
        ? (activeColor.images as string[])
        : (activeColor.image_url ? [activeColor.image_url] : [])))
    : [];
  const gallery: { id: string; url: string }[] = activeColor && colorImages.length > 0
    ? colorImages.map((u: string, i: number) => ({ id: `c-${activeColor.id}-${i}`, url: u }))
    : baseImages.map((im) => ({ id: im.id, url: im.url }));
  const main = gallery[activeImg]?.url ?? gallery[0]?.url ?? heroImage(product);
  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const price = Number(onSale ? product.sale_price! : product.price);

  const addToCart = () => {
    if (sizes.length > 0 && !activeSize) { toast.error("Please pick a size"); return; }
    cart.add({ productId: product.id, slug: product.slug, title: product.title, price, image: main, size: activeSize }, qty);
  };

  const buyNow = () => {
    if (sizes.length > 0 && !activeSize) { toast.error("Please pick a size"); return; }
    cart.add({ productId: product.id, slug: product.slug, title: product.title, price, image: main, size: activeSize }, qty);
    window.location.href = "/checkout";
  };

  const saveWishlist = async () => {
    if (!user) { toast.error("Sign in to save items."); return; }
    const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: product.id });
    if (error && !error.message.includes("duplicate")) toast.error(error.message);
    else toast.success("Saved to wishlist");
  };

  return (
    <div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <nav className="text-[11px] uppercase tracking-widest text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/shop" className="hover:text-primary">Shop</Link> / <span className="text-foreground">{product.title}</span>
        </nav>
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="relative aspect-[4/5] bg-surface overflow-hidden mb-3" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              {main && <img src={main} alt={product.title} className="size-full object-cover" />}
              {isAdmin && (
                <button
                  onClick={() => setManagingPhotos(true)}
                  className="absolute bottom-3 right-3 z-10 bg-primary text-primary-foreground px-4 py-3 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg"
                >
                  <Camera className="size-4" /> Manage photos
                </button>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {gallery.map((im, i) => (
                  <button key={im.id} onClick={() => setActiveImg(i)} aria-label={`View ${product.title} image ${i + 1} of ${gallery.length}`} aria-pressed={i === activeImg} className={`aspect-square bg-surface overflow-hidden border ${i === activeImg ? "border-primary" : "border-transparent"}`}>
                    <img src={im.url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            {product.tags && product.tags.length > 0 && (
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-3">{product.tags[0]}</p>
            )}
            <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-tighter">{product.title}</h1>
            <div className="mt-3 flex items-baseline gap-3">
              {onSale ? (
                <>
                  <span className="text-2xl font-bold">{formatPrice(product.sale_price!, product.currency)}</span>
                  <span className="text-base text-muted-foreground line-through">{formatPrice(product.price, product.currency)}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-destructive">Sale</span>
                </>
              ) : (
                <span className="text-2xl font-bold">{formatPrice(product.price, product.currency)}</span>
              )}
            </div>

            {product.inventory > 0 && product.inventory <= 10 && (
              <p className="mt-4 text-xs text-destructive uppercase tracking-widest font-bold">Only {product.inventory} left</p>
            )}

            <p className="mt-6 text-sm text-muted-foreground leading-relaxed">{product.description}</p>

            {colors.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] uppercase tracking-widest font-bold">Colour</span>
                  <span className="text-xs text-muted-foreground">
                    {activeColor ? activeColor.name : `${colors.length} available`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const isActive = c.id === activeColorId;
                    const imgs = Array.isArray(c.images) ? (c.images as string[]) : [];
                    const thumb = imgs[0] ?? c.image_url ?? null;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setActiveColorId(isActive ? null : c.id); setActiveImg(0); }}
                        title={c.name}
                        aria-label={c.name}
                        aria-pressed={isActive}
                        className={`size-16 overflow-hidden bg-surface border-2 transition ${isActive ? "border-primary" : "border-transparent hover:border-foreground/40"}`}
                      >
                        {thumb ? (
                          <img src={thumb} alt={c.name} className="size-full object-cover" />
                        ) : (
                          <span className="block size-full" style={{ backgroundColor: c.hex }} />
            )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] uppercase tracking-widest font-bold">Size</span>
                  <span className="text-xs text-muted-foreground">
                    {activeSize ? activeSize : `${sizes.length} available`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const isActive = s === activeSize;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setActiveSize(isActive ? null : s)}
                        aria-pressed={isActive}
                        className={`min-w-14 h-11 px-3 text-xs font-bold uppercase tracking-widest border-2 transition ${isActive ? "border-primary text-primary" : "border-border hover:border-foreground/40"}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <ul className="mt-6 space-y-2 text-sm">
                {product.features.map((f: string, i: number) => <li key={i} className="flex gap-2"><span className="text-primary">—</span>{f}</li>)}
              </ul>
            )}

            <div className="mt-8 flex items-center gap-3">
              <div className="flex items-center border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="size-11 grid place-items-center">−</button>
                <span className="w-10 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="size-11 grid place-items-center">+</button>
              </div>
              <button onClick={addToCart} className="flex-1 h-11 bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest hover:brightness-110">Add to cart</button>
              <button onClick={saveWishlist} aria-label="Save" className="size-11 grid place-items-center border border-border hover:border-primary"><Heart className="size-4" /></button>
            </div>
            <button onClick={buyNow} className="mt-3 w-full h-11 border border-border font-bold uppercase text-[11px] tracking-widest hover:border-primary">Buy it now</button>

            <div className="mt-8 grid grid-cols-3 gap-3 text-[10px] uppercase tracking-widest text-muted-foreground border-y border-border py-5">
              <div className="flex items-center gap-2"><Truck className="size-4 text-primary" /> Free UK over £120 / US £150</div>
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Authentic</div>
              <div className="flex items-center gap-2"><RefreshCw className="size-4 text-primary" /> 30-day returns</div>
            </div>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mt-8">
                <h3 className="text-[11px] uppercase tracking-widest font-bold mb-3">Specifications</h3>
                <dl className="divide-y divide-border border-y border-border text-sm">
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd>{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <section className="border-t border-border py-16 bg-surface/40">
        <div className="max-w-[1100px] mx-auto px-6">
          <h2 className="font-display text-3xl uppercase tracking-tighter mb-8">Customer reviews</h2>
          {reviews.data && reviews.data.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.data.map((r) => (
                <div key={r.id} className="border border-border p-5 bg-background">
                  <div className="flex gap-0.5 text-primary mb-2">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}
                  </div>
                  {r.title && <h4 className="font-semibold text-sm mb-1">{r.title}</h4>}
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {r.author_name} {r.verified && <span className="text-primary ml-1">✓ Verified purchase</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this product.</p>
          )}
        </div>
      </section>

      {/* RELATED */}
      {related.data && related.data.length > 0 && (
        <section className="border-t border-border py-16">
          <div className="max-w-[1400px] mx-auto px-6">
            <h2 className="font-display text-3xl uppercase tracking-tighter mb-8">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
              {related.data.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* STICKY ADD TO CART (mobile) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border p-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground line-clamp-1">{product.title}</p>
          <p className="text-sm font-bold">{formatPrice(price, product.currency)}</p>
        </div>
        <button onClick={addToCart} className="px-5 py-3 bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest">Add</button>
      </div>

      {managingPhotos && (
        <ProductPhotosModal
          product={product}
          onClose={() => setManagingPhotos(false)}
          onSaved={async () => {
            setManagingPhotos(false);
            setActiveImg(0);
            qc.invalidateQueries({ queryKey: ["products"] });
            qc.invalidateQueries({ queryKey: ["admin-products"] });
            await router.invalidate();
          }}
        />
      )}
    </div>
  );
}
