import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, X } from "lucide-react";
import { adminCall } from "./AdminLayout";
import PhotoUpload from "@/components/PhotoUpload";

interface Drink { id: string; name: string; description: string | null; category: string; price: number; is_available: boolean; tags: string[] | null; image: string | null; sort_order: number; }

const inputCls = "w-full bg-secondary border border-border px-3 py-2.5 font-body text-[13px] text-foreground focus:border-terra outline-none";
const labelCls = "font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5 block";
const btnPrimary = "bg-terra text-warm-white px-6 py-2.5 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors";
const btnGhost = "text-muted-foreground font-body text-[11px] px-4 hover:text-foreground transition-colors";

const CATEGORIES = ["Smoothie", "Infusion", "Shot Énergie", "Eau aromatisée", "Protéiné", "Détox", "Cookie & Snack", "Spécial du moment"];

export function AdminBoissons() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Partial<Drink> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await adminCall({ type: "drinks" }); setDrinks(res.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveDrink = async () => {
    if (!edit) return;
    try {
      if (edit.id) await adminCall({ action: "update_drink", drinkId: edit.id, drink: edit });
      else await adminCall({ action: "create_drink", drink: edit });
      setShowModal(false); setEdit(null); fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const toggleAvailability = async (d: Drink) => {
    try { await adminCall({ action: "update_drink", drinkId: d.id, drink: { is_available: !d.is_available } }); setDrinks(prev => prev.map(x => x.id === d.id ? { ...x, is_available: !x.is_available } : x)); }
    catch (err: any) { alert(err.message); }
  };

  const deleteDrink = async (id: string) => { if (!confirm("Supprimer ?")) return; try { await adminCall({ action: "delete_drink", drinkId: id }); fetchData(); } catch (err: any) { alert(err.message); } };

  if (loading) return <p className="font-body text-muted-foreground text-center py-20" style={{ fontWeight: 200 }}>Chargement...</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 200 }}>{drinks.length} boissons</p>
        <button onClick={() => { setEdit({ name: "", description: "", category: "Smoothie", price: 0, is_available: true, tags: [], sort_order: 0, image: null }); setShowModal(true); }}
          className={btnPrimary + " flex items-center gap-2"} style={{ borderRadius: "3px" }}><Plus size={14} /> Nouvelle boisson</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {drinks.map(drink => (
          <div key={drink.id} className="bg-card border border-border p-5 hover:border-terra/20 transition-all" style={{ borderRadius: "8px" }}>
            {drink.image && <div className="aspect-square mb-3 overflow-hidden bg-secondary" style={{ borderRadius: "4px" }}><img src={drink.image} alt={drink.name} className="w-full h-full object-cover" /></div>}
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-display text-[16px] text-foreground" style={{ fontWeight: 300 }}>{drink.name}</p>
                <p className="font-body text-[12px] text-terra" style={{ fontWeight: 300 }}>{drink.price} DH</p>
              </div>
              <span className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground bg-secondary px-2 py-1" style={{ borderRadius: "10px", fontWeight: 200 }}>{drink.category}</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => toggleAvailability(drink)} className="flex items-center gap-2 font-body text-[10px] text-muted-foreground cursor-pointer" style={{ fontWeight: 200 }}>
                <div className={`w-7 h-4 relative transition-colors ${drink.is_available ? "bg-success" : "bg-muted"}`} style={{ borderRadius: "8px" }}>
                  <div className={`absolute w-3 h-3 bg-card top-0.5 transition-all ${drink.is_available ? "left-3.5" : "left-0.5"}`} style={{ borderRadius: "50%" }} />
                </div>
                {drink.is_available ? "Dispo" : "Indispo"}
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setEdit(drink); setShowModal(true); }} className="font-body text-[10px] text-terra hover:underline" style={{ fontWeight: 200 }}>Modifier</button>
                <button onClick={() => deleteDrink(drink.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drink Modal */}
      <AnimatePresence>
        {showModal && edit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: 16 }} className="bg-card w-[480px] max-w-[95vw] max-h-[85vh] overflow-y-auto shadow-2xl" style={{ borderRadius: "10px" }} onClick={e => e.stopPropagation()}>
              <div className="px-7 py-5 border-b border-border flex justify-between items-center">
                <p className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>{edit.id ? "Modifier" : "Nouvelle boisson"}</p>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-terra"><X size={18} /></button>
              </div>
              <div className="px-7 py-5 space-y-4">
                <div><label className={labelCls}>Nom</label><input value={edit.name || ""} onChange={e => setEdit(p => ({ ...p!, name: e.target.value }))} className={inputCls} style={{ borderRadius: "4px", fontWeight: 300 }} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Catégorie</label><select value={edit.category || "Smoothie"} onChange={e => setEdit(p => ({ ...p!, category: e.target.value }))} className={inputCls} style={{ borderRadius: "4px", fontWeight: 300 }}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div><label className={labelCls}>Prix (DH)</label><input type="number" value={edit.price || 0} onChange={e => setEdit(p => ({ ...p!, price: +e.target.value }))} className={inputCls} style={{ borderRadius: "4px", fontWeight: 300 }} /></div>
                </div>
                <div><label className={labelCls}>Description</label><textarea value={edit.description || ""} onChange={e => setEdit(p => ({ ...p!, description: e.target.value }))} className={inputCls + " resize-none h-20"} style={{ borderRadius: "4px", fontWeight: 300 }} /></div>
                <div><label className={labelCls}>Photo</label>
                  <PhotoUpload images={edit.image ? [edit.image] : []} onImagesChange={imgs => setEdit(p => ({ ...p!, image: imgs[0] || null }))} maxImages={1} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={saveDrink} className={btnPrimary} style={{ borderRadius: "3px" }}>Enregistrer</button>
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
