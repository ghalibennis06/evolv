import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, X, Save } from "lucide-react";
import { adminCall } from "./AdminLayout";
import PhotoUpload from "@/components/PhotoUpload";

interface Product { id: string; name: string; description: string | null; price: number; image_url: string | null; category: string | null; in_stock: boolean | null; stripe_price_id: string | null; }
interface Order { id: string; client_name: string; client_email: string; client_phone: string | null; product_id: string | null; quantity: number | null; total_amount: number; status: string | null; payment_status: string | null; created_at: string; }

const inputCls = "w-full bg-secondary border border-border px-3 py-2.5 font-body text-[13px] text-foreground focus:border-terra outline-none";
const labelCls = "font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5 block";
const btnPrimary = "bg-terra text-warm-white px-6 py-2.5 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors";
const btnGhost = "text-muted-foreground font-body text-[11px] px-4 hover:text-foreground transition-colors";

const CATEGORIES = ["Vêtements", "Accessoires Pilates", "Nutrition", "Soin Corps", "Carte Cadeau"];

export function AdminBoutique() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Partial<Product> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([adminCall({ type: "products" }), adminCall({ type: "orders" })]);
      setProducts(p.data || []); setOrders(o.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveProduct = async () => {
    if (!edit) return;
    try {
      if (edit.id) await adminCall({ action: "update_product", productId: edit.id, product: edit });
      else await adminCall({ action: "create_product", product: edit });
      setShowModal(false); setEdit(null); fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const deleteProduct = async (id: string) => { if (!confirm("Supprimer ?")) return; try { await adminCall({ action: "delete_product", productId: id }); fetchData(); } catch (err: any) { alert(err.message); } };

  const toggleStock = async (p: Product) => {
    try { await adminCall({ action: "update_product", productId: p.id, product: { in_stock: !p.in_stock } }); setProducts(prev => prev.map(x => x.id === p.id ? { ...x, in_stock: !x.in_stock } : x)); }
    catch (err: any) { alert(err.message); }
  };

  if (loading) return <p className="font-body text-muted-foreground text-center py-20" style={{ fontWeight: 200 }}>Chargement...</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 200 }}>{products.length} produits · {orders.length} commandes</p>
        <button onClick={() => { setEdit({ name: "", description: "", price: 0, category: "Accessoires Pilates", in_stock: true, image_url: null, stripe_price_id: null }); setShowModal(true); }}
          className={btnPrimary + " flex items-center gap-2"} style={{ borderRadius: "3px" }}><Plus size={14} /> Nouveau produit</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {products.map(product => (
          <div key={product.id} className="bg-card border border-border p-5 hover:border-terra/20 transition-all" style={{ borderRadius: "8px" }}>
            {product.image_url && <div className="aspect-square mb-3 overflow-hidden bg-secondary" style={{ borderRadius: "4px" }}><img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /></div>}
            <p className="font-display text-[16px] text-foreground" style={{ fontWeight: 300 }}>{product.name}</p>
            <p className="font-body text-[12px] text-terra" style={{ fontWeight: 300 }}>{product.price} DH</p>
            {product.category && <p className="font-body text-[9px] tracking-[0.15em] uppercase text-muted-foreground mt-1" style={{ fontWeight: 200 }}>{product.category}</p>}
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => toggleStock(product)} className="flex items-center gap-2 font-body text-[10px] text-muted-foreground cursor-pointer" style={{ fontWeight: 200 }}>
                <div className={`w-7 h-4 relative transition-colors ${product.in_stock ? "bg-success" : "bg-muted"}`} style={{ borderRadius: "8px" }}>
                  <div className={`absolute w-3 h-3 bg-card top-0.5 transition-all ${product.in_stock ? "left-3.5" : "left-0.5"}`} style={{ borderRadius: "50%" }} />
                </div>
                {product.in_stock ? "En stock" : "Épuisé"}
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setEdit(product); setShowModal(true); }} className="font-body text-[10px] text-terra hover:underline" style={{ fontWeight: 200 }}>Modifier</button>
                <button onClick={() => deleteProduct(product.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length > 0 && (
        <>
          <h3 className="font-display text-lg text-foreground mb-4" style={{ fontWeight: 300 }}>Commandes récentes</h3>
          <div className="space-y-2">
            {orders.slice(0, 20).map(order => (
              <div key={order.id} className="bg-card border border-border p-4 flex items-center justify-between" style={{ borderRadius: "6px" }}>
                <div>
                  <p className="font-body text-[13px] text-foreground" style={{ fontWeight: 300 }}>{order.client_name}</p>
                  <p className="font-body text-[10px] text-muted-foreground" style={{ fontWeight: 200 }}>{order.client_email} · {new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-body text-[12px] text-terra" style={{ fontWeight: 300 }}>{order.total_amount} DH</span>
                  <span className={`font-body text-[9px] tracking-[0.15em] uppercase px-2 py-1 ${order.status === "livré" ? "bg-success-light text-success" : order.status === "annulé" ? "bg-destructive/10 text-destructive" : "bg-terra-pale text-terra"}`} style={{ borderRadius: "10px", fontWeight: 200 }}>
                    {order.status || "nouveau"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {showModal && edit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: 16 }} className="bg-card w-[520px] max-w-[95vw] max-h-[85vh] overflow-y-auto shadow-2xl" style={{ borderRadius: "10px" }} onClick={e => e.stopPropagation()}>
              <div className="px-7 py-5 border-b border-border flex justify-between items-center">
                <p className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>{edit.id ? "Modifier produit" : "Nouveau produit"}</p>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-terra"><X size={18} /></button>
              </div>
              <div className="px-7 py-5 space-y-4">
                <div><label className={labelCls}>Nom</label><input value={edit.name || ""} onChange={e => setEdit(p => ({ ...p!, name: e.target.value }))} className={inputCls} style={{ borderRadius: "4px", fontWeight: 300 }} /></div>
                <div><label className={labelCls}>Description</label><textarea value={edit.description || ""} onChange={e => setEdit(p => ({ ...p!, description: e.target.value }))} className={inputCls + " resize-none h-20"} style={{ borderRadius: "4px", fontWeight: 300 }} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Catégorie</label><select value={edit.category || ""} onChange={e => setEdit(p => ({ ...p!, category: e.target.value }))} className={inputCls} style={{ borderRadius: "4px", fontWeight: 300 }}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div><label className={labelCls}>Prix (DH)</label><input type="number" value={edit.price || 0} onChange={e => setEdit(p => ({ ...p!, price: +e.target.value }))} className={inputCls} style={{ borderRadius: "4px", fontWeight: 300 }} /></div>
                </div>
                <div><label className={labelCls}>Photo</label>
                  <PhotoUpload images={edit.image_url ? [edit.image_url] : []} onImagesChange={imgs => setEdit(p => ({ ...p!, image_url: imgs[0] || null }))} maxImages={1} />
                </div>
                <div><label className={labelCls}>Stripe Price ID</label><input value={edit.stripe_price_id || ""} onChange={e => setEdit(p => ({ ...p!, stripe_price_id: e.target.value || null }))} className={inputCls} style={{ borderRadius: "4px", fontWeight: 300 }} placeholder="price_xxx (optionnel)" /></div>
                <div className="flex gap-3 pt-2">
                  <button onClick={saveProduct} className={btnPrimary} style={{ borderRadius: "3px" }}>Enregistrer</button>
                  <button onClick={() => setShowModal(false)} className={btnGhost}>Annuler</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
