import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchBrands, fetchCategories, fetchProducts, heroImage, type ProductWithImages } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useState, useRef, useEffect } from "react";
import { Plus, Upload, Sparkles, Trash2, Copy, X, Edit3, Camera, ImagePlus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateProductListing } from "@/lib/ai-product.functions";
import { toast } from "sonner";
import { ProductPhotosModal } from "@/components/admin/ProductPhotosModal";
import { z } from "zod";

const adminProductsSearch = z.object({ new: z.string().optional() });

export const Route = createFileRoute("/admin/products")({
  validateSearch: adminProductsSearch,
  component: AdminProductsPage,
});


type DraftColor = { id?: string; name: string; hex: string; image_url: string | null; images: string[]; sort_order: number };

type Draft = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  seo_description: string;
  price: number;
  sale_price: number | null;
  inventory: number;
  category_id: string | null;
  brand: string;
  gender: "mens" | "womens" | "unisex" | "kids";
  status: "draft" | "active" | "archived";
  is_featured: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
  features: string[];
  meta_tags: string[];
  sizes: string[];
  images: { url: string; sort_order: number; id?: string }[];
  colors: DraftColor[];
};

const blankDraft: Draft = {
  slug: "", title: "", description: "", seo_description: "", price: 0, sale_price: null, inventory: 0,
  category_id: null, brand: "", gender: "unisex", status: "draft", is_featured: false, is_trending: false, is_best_seller: false,
  features: [], meta_tags: [], sizes: [], images: [], colors: [],
};

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

function AdminProductsPage() {
  const qc = useQueryClient();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchProducts({ limit: 200 }) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const brands = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const [editing, setEditing] = useState<Draft | null>(null);
  const [photoEditing, setPhotoEditing] = useState<ProductWithImages | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Auto-open new draft when arriving with ?new=<categorySlug>
  useEffect(() => {
    if (!search.new || !categories.data || editing) return;
    const cat = categories.data.find((c) => c.slug === search.new);
    setEditing({ ...blankDraft, category_id: cat?.id ?? null });
    navigate({ search: {}, replace: true });
  }, [search.new, categories.data, editing, navigate]);

  const startNew = () => setEditing({ ...blankDraft });

  const startEdit = (p: ProductWithImages) => setEditing({
    id: p.id, slug: p.slug, title: p.title, description: p.description ?? "",
    seo_description: p.seo_description ?? "", price: Number(p.price), sale_price: p.sale_price != null ? Number(p.sale_price) : null,
    inventory: p.inventory, category_id: p.category_id, brand: p.brand ?? "", gender: p.gender ?? "unisex", status: p.status,
    is_featured: p.is_featured, is_trending: p.is_trending, is_best_seller: p.is_best_seller,
    features: p.features ?? [], meta_tags: p.meta_tags ?? [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    images: [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ url: i.url, sort_order: i.sort_order, id: i.id })),
    colors: [...(p.product_colors ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((c) => ({ id: c.id, name: c.name, hex: c.hex, image_url: c.image_url, images: Array.isArray(c.images) ? c.images : [], sort_order: c.sort_order })),
  });

  const duplicate = async (p: ProductWithImages) => {
    const draft: Draft = {
      slug: `${p.slug}-copy-${Date.now().toString(36)}`, title: `${p.title} (copy)`, description: p.description ?? "",
      seo_description: p.seo_description ?? "", price: Number(p.price), sale_price: p.sale_price != null ? Number(p.sale_price) : null,
      inventory: p.inventory, category_id: p.category_id, brand: p.brand ?? "", gender: p.gender ?? "unisex", status: "draft",
      is_featured: false, is_trending: false, is_best_seller: false,
      features: p.features ?? [], meta_tags: p.meta_tags ?? [],
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      images: [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i, ix) => ({ url: i.url, sort_order: ix })),
      colors: [...(p.product_colors ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((c, ix) => ({ name: c.name, hex: c.hex, image_url: c.image_url, images: Array.isArray(c.images) ? c.images : [], sort_order: ix })),
    };
    setEditing(draft);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} products?`)) return;
    const { error } = await supabase.from("products").delete().in("id", [...selected]);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={startNew} className="bg-primary text-primary-foreground px-4 py-2 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2"><Plus className="size-3" /> New product</button>
        {selected.size > 0 && (
          <button onClick={bulkDelete} className="border border-destructive text-destructive px-4 py-2 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2"><Trash2 className="size-3" /> Delete {selected.size}</button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{products.data?.length ?? 0} products</span>
      </div>

      <div className="border border-border divide-y divide-border">
        {products.data?.map((p) => (
          <div key={p.id} className="grid grid-cols-[24px_64px_1fr_120px_100px_140px] gap-4 items-center p-3 hover:bg-surface/50">
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
            <div className="size-16 bg-surface overflow-hidden">{heroImage(p) && <img src={heroImage(p)} className="size-full object-cover" />}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{p.title}</p>
              <p className="text-xs text-muted-foreground truncate">{p.slug}</p>
            </div>
            <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 border ${p.status === "active" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{p.status}</span>
            <span className="text-sm">{formatPrice(p.price, p.currency)}</span>
            <div className="flex gap-1">
              <button onClick={() => setPhotoEditing(p)} className="p-2 hover:bg-surface text-primary" title="Manage photos"><Camera className="size-4" /></button>
              <button onClick={() => startEdit(p)} className="p-2 hover:bg-surface" title="Edit"><Edit3 className="size-4" /></button>
              <button onClick={() => duplicate(p)} className="p-2 hover:bg-surface" title="Duplicate"><Copy className="size-4" /></button>
            </div>
          </div>
        ))}
        {products.data?.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No products yet. Click "New product" to add one.</div>}
      </div>

      {editing && <ProductEditor draft={editing} categories={categories.data ?? []} brands={brands.data ?? []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); qc.invalidateQueries({ queryKey: ["brands"] }); }} />}
      {photoEditing && <ProductPhotosModal product={photoEditing} onClose={() => setPhotoEditing(null)} onSaved={() => { setPhotoEditing(null); qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); }} />}

    </div>
  );
}

function ProductEditor({ draft, categories, brands, onClose, onSaved }: { draft: Draft; categories: { id: string; name: string }[]; brands: string[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const generateAi = useServerFn(generateProductListing);

  const handleFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const list = Array.from(files);
    try {
      const uploaded: { url: string; sort_order: number }[] = [];
      for (const file of list) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${d.slug || "draft"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        uploaded.push({ url: signed?.signedUrl ?? "", sort_order: d.images.length + uploaded.length });
      }
      setD((p) => ({ ...p, images: [...p.images, ...uploaded] }));
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const runAi = async () => {
    const firstImg = d.images[0]?.url;
    if (!firstImg) { toast.error("Upload at least one image first"); return; }
    setAiLoading(true);
    try {
      // Make sure we have a fresh session so the serverFn receives an Authorization header
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        await supabase.auth.refreshSession();
        const { data: again } = await supabase.auth.getSession();
        if (!again.session) {
          toast.error("You're signed out. Please sign in again to use AI Generate.");
          setAiLoading(false);
          return;
        }
      }
      const r = await generateAi({ data: { imageUrl: firstImg, hint: d.title || undefined } });
      const cat = categories.find((c) => (c as { slug?: string }).slug === r.suggested_category);
      setD((p) => ({
        ...p,
        title: r.title,
        slug: p.slug || slugify(r.title),
        description: r.description,
        seo_description: r.seo_description,
        features: r.features,
        meta_tags: r.meta_tags,
        price: p.price || r.suggested_price,
        category_id: cat?.id ?? p.category_id,
      }));
      toast.success("AI generated listing");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI generation failed";
      if (msg.includes("authorization header") || msg.includes("Unauthorized")) {
        toast.error("Your session expired. Please sign in again, then retry.");
      } else {
        toast.error(msg);
      }
    } finally { setAiLoading(false); }
  };

  const save = async () => {
    if (!d.title.trim()) { toast.error("Title required"); return; }
    const finalSlug = slugify(d.slug) || slugify(d.title);
    setSaving(true);
    try {
      const payload = {
        slug: finalSlug, title: d.title, description: d.description, seo_description: d.seo_description,
        price: d.price, sale_price: d.sale_price, inventory: d.inventory, category_id: d.category_id,
        currency: "GBP",
        brand: d.brand.trim() || null,
        gender: d.gender,
        status: d.status, is_featured: d.is_featured, is_trending: d.is_trending, is_best_seller: d.is_best_seller,
        features: d.features, meta_tags: d.meta_tags, sizes: d.sizes,
      };
      let productId = d.id;
      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        // Always insert a new product. If the slug collides, auto-suffix so we never overwrite an existing one.
        const { data: existing } = await supabase.from("products").select("id").eq("slug", finalSlug).maybeSingle();
        const insertPayload = existing
          ? { ...payload, slug: `${finalSlug}-${Date.now().toString(36)}` }
          : payload;
        const { data, error } = await supabase.from("products").insert(insertPayload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }
      // Replace images: simpler — delete then insert
      await supabase.from("product_images").delete().eq("product_id", productId!);
      if (d.images.length > 0) {
        const { error: imgErr } = await supabase.from("product_images").insert(
          d.images.map((im, i) => ({ product_id: productId!, url: im.url, sort_order: i }))
        );
        if (imgErr) throw imgErr;
      }
      // Replace colors: delete then insert
      await supabase.from("product_colors").delete().eq("product_id", productId!);
      if (d.colors.length > 0) {
        const { error: colErr } = await supabase.from("product_colors").insert(
          d.colors.map((c, i) => ({ product_id: productId!, name: c.name, hex: c.hex, image_url: c.images[0] ?? c.image_url, images: c.images, sort_order: i }))
        );
        if (colErr) throw colErr;
      }
      toast.success("Product saved");
      onSaved();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message;
      if (msg?.includes("products_slug_key")) {
        toast.error(`A product called "${d.title}" already exists — edit it from your product list instead.`);
      } else {
        toast.error(msg || "Save failed");
      }
    } finally { setSaving(false); }
  };

  const reorderImage = (from: number, to: number) => {
    if (to < 0 || to >= d.images.length) return;
    const next = [...d.images];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setD({ ...d, images: next.map((i, ix) => ({ ...i, sort_order: ix })) });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-stretch justify-end">
      <div className="w-full max-w-3xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase tracking-tighter">{d.id ? "Edit product" : "New product"}</h2>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving} className="bg-primary text-primary-foreground px-5 py-2 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={onClose} className="p-2"><X className="size-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Images */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] uppercase tracking-widest font-bold">Images</h3>
              <button onClick={runAi} disabled={aiLoading || d.images.length === 0} className="text-[11px] uppercase tracking-widest font-bold text-primary disabled:opacity-50 flex items-center gap-1">
                <Sparkles className="size-3" /> {aiLoading ? "Analysing..." : "AI generate listing"}
              </button>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
              className={`border-2 border-dashed ${dragOver ? "border-primary bg-primary/5" : "border-border"} p-6 text-center`}
            >
              <Upload className="size-6 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{uploading ? "Uploading..." : "Add photos from your phone or computer"}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading} className="bg-primary text-primary-foreground px-4 py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                  <Camera className="size-4" /> Take photo
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="border border-border px-4 py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                  <ImagePlus className="size-4" /> Choose from library
                </button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { if (e.target.files) { handleFiles(e.target.files); e.target.value = ""; } }} />
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if (e.target.files) { handleFiles(e.target.files); e.target.value = ""; } }} />
            </div>
            {d.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {d.images.map((im, i) => (
                  <div key={i} className="relative aspect-square bg-surface group">
                    <img src={im.url} className="size-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                      <div className="flex gap-1">
                        <button onClick={() => reorderImage(i, i - 1)} className="size-6 bg-background text-foreground text-xs">←</button>
                        <button onClick={() => reorderImage(i, i + 1)} className="size-6 bg-background text-foreground text-xs">→</button>
                      </div>
                      <button onClick={() => setD({ ...d, images: d.images.filter((_, ix) => ix !== i) })} className="text-xs uppercase tracking-widest text-destructive">Remove</button>
                    </div>
                    {i === 0 && <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] uppercase tracking-widest px-1.5 py-0.5">Main</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Colors */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] uppercase tracking-widest font-bold">Colors</h3>
              <button
                type="button"
                onClick={() => setD({ ...d, colors: [...d.colors, { name: "", hex: "#000000", image_url: null, images: [], sort_order: d.colors.length }] })}
                className="text-[11px] uppercase tracking-widest font-bold text-primary flex items-center gap-1"
              >
                <Plus className="size-3" /> Add color
              </button>
            </div>
            {d.colors.length === 0 && <p className="text-xs text-muted-foreground">Add color options so shoppers can switch the photo by clicking a swatch.</p>}
            <div className="space-y-2">
              {d.colors.map((c, i) => (
                <ColorRow
                  key={i}
                  color={c}
                  slug={d.slug || "draft"}
                  onChange={(next) => setD({ ...d, colors: d.colors.map((x, ix) => ix === i ? next : x) })}
                  onRemove={() => setD({ ...d, colors: d.colors.filter((_, ix) => ix !== i) })}
                />
              ))}
            </div>
          </section>

          {/* Sizes */}
          <SizesEditor sizes={d.sizes} onChange={(next) => setD({ ...d, sizes: next })} />

          {/* Basics */}
          <Field label="Title"><input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value, slug: d.slug || slugify(e.target.value) })} className={inputCls} /></Field>
          <Field label="Slug"><input value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} className={inputCls} /></Field>
          <Field label="Description"><textarea rows={3} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} className={inputCls} /></Field>
          <Field label="SEO description (under 160 chars)"><textarea rows={2} maxLength={200} value={d.seo_description} onChange={(e) => setD({ ...d, seo_description: e.target.value })} className={inputCls} /></Field>
          <Field label="Feature bullets (one per line)">
            <textarea rows={4} value={d.features.join("\n")} onChange={(e) => setD({ ...d, features: e.target.value.split("\n").filter(Boolean) })} className={inputCls} />
          </Field>
          <Field label="Meta tags (comma separated)">
            <input value={d.meta_tags.join(", ")} onChange={(e) => setD({ ...d, meta_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={inputCls} />
          </Field>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price"><input type="number" inputMode="decimal" min={0} step="0.01" value={d.price === 0 ? "" : d.price} placeholder="0.00" onFocus={(e) => e.target.select()} onChange={(e) => setD({ ...d, price: e.target.value === "" ? 0 : Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Sale price (optional)"><input type="number" inputMode="decimal" min={0} step="0.01" value={d.sale_price ?? ""} placeholder="0.00" onFocus={(e) => e.target.select()} onChange={(e) => setD({ ...d, sale_price: e.target.value ? Number(e.target.value) : null })} className={inputCls} /></Field>
            <Field label="Inventory"><input type="number" inputMode="numeric" min={0} value={d.inventory === 0 ? "" : d.inventory} placeholder="0" onFocus={(e) => e.target.select()} onChange={(e) => setD({ ...d, inventory: e.target.value === "" ? 0 : Number(e.target.value) })} className={inputCls} /></Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={d.category_id ?? ""} onChange={(e) => setD({ ...d, category_id: e.target.value || null })} className={inputCls}>
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as Draft["status"] })} className={inputCls}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>

          <Field label="Department (auto-files into Men's, Women's or Kids)">
            <select value={d.gender} onChange={(e) => setD({ ...d, gender: e.target.value as Draft["gender"] })} className={inputCls}>
              <option value="mens">Men's</option>
              <option value="womens">Women's</option>
              <option value="kids">Kids</option>
              <option value="unisex">Unisex / Other</option>
            </select>
          </Field>

          <Field label="Brand (type a new one or pick existing)">
            <input
              list="admin-brand-list"
              value={d.brand}
              onChange={(e) => setD({ ...d, brand: e.target.value })}
              placeholder="e.g. Nike, Adidas, Trapstar"
              className={inputCls}
            />
            <datalist id="admin-brand-list">
              {brands.map((b) => <option key={b} value={b} />)}
            </datalist>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Toggle label="Featured" value={d.is_featured} onChange={(v) => setD({ ...d, is_featured: v })} />
            <Toggle label="Trending" value={d.is_trending} onChange={(v) => setD({ ...d, is_trending: v })} />
            <Toggle label="Best seller" value={d.is_best_seller} onChange={(v) => setD({ ...d, is_best_seller: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "mt-1 w-full bg-transparent border border-border focus:border-primary outline-none px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className={`border px-3 py-2 text-[11px] uppercase tracking-widest font-bold text-left ${value ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
      {value ? "✓ " : ""}{label}
    </button>
  );
}

function ColorRow({ color, slug, onChange, onRemove }: { color: DraftColor; slug: string; onChange: (c: DraftColor) => void; onRemove: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const existing = color.images.length > 0 ? color.images : (color.image_url ? [color.image_url] : []);

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${slug}/colors/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signed?.signedUrl) urls.push(signed.signedUrl);
      }
      const merged = [...existing, ...urls];
      onChange({ ...color, images: merged, image_url: merged[0] ?? null });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const removeImage = (idx: number) => {
    const next = existing.filter((_, i) => i !== idx);
    onChange({ ...color, images: next, image_url: next[0] ?? null });
  };

  return (
    <div className="border border-border p-3 space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color.hex}
          onChange={(e) => onChange({ ...color, hex: e.target.value })}
          className="size-10 bg-transparent border border-border cursor-pointer shrink-0"
          aria-label="Pick color"
        />
        <input
          type="text"
          placeholder="Color name (e.g. Triple Black)"
          value={color.name}
          onChange={(e) => onChange({ ...color, name: e.target.value })}
          className="flex-1 min-w-0 bg-transparent border border-border focus:border-primary outline-none px-3 py-2 text-sm"
        />
        <button type="button" onClick={onRemove} className="p-2 text-destructive shrink-0" aria-label="Remove color"><Trash2 className="size-4" /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {existing.map((url, i) => (
          <div key={i} className="relative size-16 bg-surface">
            <img src={url} className="size-full object-cover" alt="" />
            <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full size-5 grid place-items-center text-xs">×</button>
            {i === 0 && <span className="absolute bottom-0 left-0 bg-primary text-primary-foreground text-[8px] uppercase tracking-widest px-1">Main</span>}
          </div>
        ))}
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="size-16 border-2 border-dashed border-border hover:border-primary grid place-items-center text-[10px] uppercase tracking-widest font-bold disabled:opacity-50">
          {uploading ? "..." : <ImagePlus className="size-4" />}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) { uploadFiles(e.target.files); e.target.value = ""; } }} />
      </div>
    </div>
  );
}

const UK_SHOE_SIZES = ["UK 3","UK 3.5","UK 4","UK 4.5","UK 5","UK 5.5","UK 6","UK 6.5","UK 7","UK 7.5","UK 8","UK 8.5","UK 9","UK 9.5","UK 10","UK 10.5","UK 11","UK 11.5","UK 12","UK 13"];
const UK_CLOTHING_SIZES = ["XXS","XS","S","M","L","XL","XXL","3XL"];
const UK_KIDS_SIZES = ["3-4y","5-6y","7-8y","9-10y","11-12y","13-14y"];

function SizesEditor({ sizes, onChange }: { sizes: string[]; onChange: (next: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const toggle = (s: string) => {
    onChange(sizes.includes(s) ? sizes.filter((x) => x !== s) : [...sizes, s]);
  };
  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    if (!sizes.includes(v)) onChange([...sizes, v]);
    setCustom("");
  };
  const fillAll = (preset: string[]) => {
    const merged = [...sizes];
    for (const s of preset) if (!merged.includes(s)) merged.push(s);
    onChange(merged);
  };
  const clear = () => onChange([]);

  const renderPreset = (label: string, preset: string[]) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <button type="button" onClick={() => fillAll(preset)} className="text-[10px] uppercase tracking-widest font-bold text-primary">Select all</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {preset.map((s) => {
          const active = sizes.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground/40"}`}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] uppercase tracking-widest font-bold">Sizes available</h3>
        {sizes.length > 0 && (
          <button type="button" onClick={clear} className="text-[10px] uppercase tracking-widest font-bold text-destructive">Clear all</button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">Tap each size you have in stock. Shoppers must pick one before adding to cart.</p>
      <div className="space-y-4">
        {renderPreset("UK shoe sizes", UK_SHOE_SIZES)}
        {renderPreset("Clothing (UK)", UK_CLOTHING_SIZES)}
        {renderPreset("Kids (UK)", UK_KIDS_SIZES)}
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Custom size</span>
          <div className="mt-1 flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
              placeholder="e.g. One size, 32W 32L"
              className="flex-1 bg-transparent border border-border focus:border-primary outline-none px-3 py-2 text-sm"
            />
            <button type="button" onClick={addCustom} className="px-4 py-2 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest">Add</button>
          </div>
        </div>
      </div>
      {sizes.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Selected ({sizes.length})</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <button key={s} type="button" onClick={() => toggle(s)} className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-primary bg-primary text-primary-foreground">
                {s} ×
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}





