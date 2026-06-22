import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, ImagePlus, X } from "lucide-react";

export type PhotosModalProduct = {
  id: string;
  slug: string;
  title: string;
  product_images?: { id?: string; url: string; sort_order: number }[] | null;
};

export function ProductPhotosModal({ product, onClose, onSaved }: { product: PhotosModalProduct; onClose: () => void; onSaved: () => void }) {
  const initial = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ url: i.url, sort_order: i.sort_order }));
  const [images, setImages] = useState<{ url: string; sort_order: number }[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { toast.error("You're signed out. Please sign in again to upload."); return; }
      const uploaded: { url: string; sort_order: number }[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${product.slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
        if (error) throw error;
        const { data: signed, error: signErr } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Could not create image link");
        uploaded.push({ url: signed.signedUrl, sort_order: images.length + uploaded.length });
      }
      setImages((p) => [...p, ...uploaded]);
      toast.success(`${uploaded.length} photo(s) added — tap Save to keep them`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const reorder = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setImages(next.map((i, ix) => ({ ...i, sort_order: ix })));
  };

  const save = async () => {
    setSaving(true);
    try {
      const { error: delErr } = await supabase.from("product_images").delete().eq("product_id", product.id);
      if (delErr) throw delErr;
      if (images.length > 0) {
        const { error } = await supabase.from("product_images").insert(
          images.map((im, i) => ({ product_id: product.id, url: im.url, sort_order: i }))
        );
        if (error) throw error;
      }
      toast.success("Photos saved");
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-stretch justify-center sm:items-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-background border border-border overflow-y-auto max-h-screen">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-lg uppercase tracking-tighter truncate">{product.title}</h2>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Manage photos</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button onClick={onClose} className="p-2"><X className="size-5" /></button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading} className="bg-primary text-primary-foreground px-4 py-4 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
              <Camera className="size-4" /> Take photo
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="border border-border px-4 py-4 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
              <ImagePlus className="size-4" /> From library
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { if (e.target.files?.length) { handleFiles(e.target.files); e.target.value = ""; } }} />
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) { handleFiles(e.target.files); e.target.value = ""; } }} />
          {uploading && <p className="text-center text-xs text-muted-foreground">Uploading...</p>}
          {images.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No photos yet. Add one above.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {images.map((im, i) => (
                <div key={i} className="relative aspect-square bg-surface">
                  <img src={im.url} className="size-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 flex items-center justify-between px-1 py-1">
                    <button onClick={() => reorder(i, i - 1)} className="size-6 bg-background text-foreground text-xs">←</button>
                    <button onClick={() => setImages(images.filter((_, ix) => ix !== i))} className="text-[9px] uppercase tracking-widest text-destructive font-bold px-1">Remove</button>
                    <button onClick={() => reorder(i, i + 1)} className="size-6 bg-background text-foreground text-xs">→</button>
                  </div>
                  {i === 0 && <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] uppercase tracking-widest px-1.5 py-0.5">Main</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
