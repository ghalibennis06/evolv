import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, X, Star, Check, Edit2, Zap, MessageSquare } from "lucide-react";
import { adminCall } from "./AdminLayout";

interface PricingPlan {
  id: string; name: string; description: string; price: number;
  original_price: number | null; sessions_included: number | null;
  validity_days: number | null; is_popular: boolean; features: string[];
  is_active: boolean; sort_order: number; cta_text: string;
}

const iCls = "w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[13px] text-foreground focus:border-terra outline-none placeholder:text-muted-foreground/50";
const lCls = "font-body text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5 block";

export function AdminTarifs() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Partial<PricingPlan> | null>(null);
  const [newFeature, setNewFeature] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await adminCall({ type: "pricing" }); setPlans(res.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEdit({ name: "", description: "", price: 0, original_price: null, sessions_included: null, validity_days: null, is_popular: false, features: [], is_active: true, sort_order: plans.length, cta_text: "payzone" });
    setShowModal(true);
  };

  const openEdit = (plan: PricingPlan) => { setEdit({ ...plan }); setShowModal(true); };

  const save = async () => {
    if (!edit) return;
    try {
      if (edit.id) await adminCall({ action: "update_pricing", pricingId: edit.id, pricing: edit });
      else await adminCall({ action: "create_pricing", pricing: edit });
      setShowModal(false); setEdit(null); fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer cette formule ?")) return;
    try { await adminCall({ action: "delete_pricing", pricingId: id }); fetchData(); }
    catch (err: any) { alert(err.message); }
  };

  const toggleActive = async (plan: PricingPlan) => {
    await adminCall({ action: "update_pricing", pricingId: plan.id, pricing: { ...plan, is_active: !plan.is_active } });
    fetchData();
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-terra/30 border-t-terra rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-display text-xl text-foreground" style={{ fontWeight: 300, letterSpacing: "0.06em" }}>Tarifs & Formules</p>
          <p className="font-body text-[11px] text-muted-foreground mt-0.5">{plans.filter(p => p.is_active).length} formule(s) active(s) · visible sur /carte-black et /tarifs</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-terra text-warm-white px-5 py-2.5 rounded-full font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra/90 transition-colors" style={{ fontWeight: 500 }}>
          <Plus size={13} /> Nouvelle formule
        </button>
      </div>

      {/* Cards grid */}
      {plans.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-16 text-center">
          <p className="font-display text-2xl text-foreground mb-2" style={{ fontWeight: 300 }}>Aucune formule</p>
          <p className="font-body text-sm text-muted-foreground mb-6">Créez votre première formule tarifaire.</p>
          <button onClick={openNew} className="inline-flex items-center gap-2 bg-terra text-warm-white px-6 py-3 rounded-full font-body text-[11px] tracking-[0.2em] uppercase" style={{ fontWeight: 500 }}>
            <Plus size={13} /> Créer une formule
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const perSession = plan.sessions_included && plan.sessions_included > 1 ? Math.round(plan.price / plan.sessions_included) : null;
            const savings = plan.original_price ? plan.original_price - plan.price : 0;
            const ctaType = plan.cta_text === "pack_request" ? "pack_request" : "payzone";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`relative bg-card border rounded-3xl overflow-hidden transition-all ${plan.is_popular ? "border-terra/40 shadow-[0_0_30px_rgba(184,99,74,0.08)]" : "border-border"} ${!plan.is_active ? "opacity-50" : ""}`}
              >
                {/* Popular ribbon */}
                {plan.is_popular && (
                  <div className="absolute top-4 right-4">
                    <span className="flex items-center gap-1 bg-terra text-warm-white font-body text-[8px] tracking-[0.25em] uppercase px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>
                      <Star size={8} fill="currentColor" /> Populaire
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Name + sessions */}
                  <p className="font-body text-[9px] tracking-[0.4em] uppercase text-terra mb-1" style={{ fontWeight: 300 }}>
                    {plan.sessions_included ? `${plan.sessions_included} séance${plan.sessions_included > 1 ? "s" : ""}` : "Séance unique"}
                  </p>
                  <h3 className="font-display text-xl text-foreground mb-4" style={{ fontWeight: 300, letterSpacing: "0.06em" }}>{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-4xl text-foreground" style={{ fontWeight: 200 }}>{plan.price.toLocaleString("fr-FR")}</span>
                      <span className="font-body text-muted-foreground">DH</span>
                      {plan.original_price && (
                        <span className="font-body text-[12px] text-muted-foreground/50 line-through">{plan.original_price.toLocaleString("fr-FR")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {perSession && (
                        <span className="font-body text-[11px] text-muted-foreground">{perSession} DH/séance</span>
                      )}
                      {savings > 0 && (
                        <span className="font-body text-[9px] bg-[#4E9E7A]/15 text-[#4E9E7A] border border-[#4E9E7A]/20 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
                          −{savings} DH
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {plan.validity_days && (
                      <span className="font-body text-[10px] bg-secondary border border-border px-2.5 py-1 rounded-full text-muted-foreground">{plan.validity_days}j validité</span>
                    )}
                    <span className={`font-body text-[10px] px-2.5 py-1 rounded-full border ${ctaType === "payzone" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-[#25D366]/10 text-[#128C7E] border-[#25D366]/20"}`} style={{ fontWeight: 500 }}>
                      {ctaType === "payzone" ? <><Zap size={9} className="inline mr-1" />Payzone</> : <><MessageSquare size={9} className="inline mr-1" />Sur place</>}
                    </span>
                  </div>

                  {/* Features */}
                  {plan.features?.length > 0 && (
                    <ul className="space-y-1 mb-5">
                      {plan.features.slice(0, 4).map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2">
                          <Check size={11} className="text-terra shrink-0 mt-0.5" />
                          <span className="font-body text-[11px] text-muted-foreground">{f}</span>
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="font-body text-[10px] text-muted-foreground/50 pl-4">+{plan.features.length - 4} autres</li>
                      )}
                    </ul>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <button onClick={() => openEdit(plan)} className="flex-1 flex items-center justify-center gap-1.5 border border-border text-muted-foreground py-2 rounded-xl font-body text-[10px] tracking-[0.15em] uppercase hover:border-terra/30 hover:text-terra transition-colors" style={{ fontWeight: 500 }}>
                      <Edit2 size={11} /> Modifier
                    </button>
                    <button onClick={() => toggleActive(plan)} className={`px-3 py-2 rounded-xl font-body text-[10px] tracking-[0.15em] uppercase border transition-colors ${plan.is_active ? "bg-secondary text-muted-foreground border-border hover:text-destructive" : "bg-terra/10 text-terra border-terra/20"}`} style={{ fontWeight: 500 }}>
                      {plan.is_active ? "Désactiver" : "Activer"}
                    </button>
                    <button onClick={() => del(plan.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-destructive/5 text-destructive/50 hover:bg-destructive/10 hover:text-destructive transition-colors border border-destructive/10">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && edit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="bg-card border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
              onClick={e => e.stopPropagation()}>

              <div className="px-6 py-5 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
                <div>
                  <p className="font-body text-[9px] tracking-[0.3em] uppercase text-terra mb-0.5" style={{ fontWeight: 300 }}>Tarifs</p>
                  <p className="font-display text-lg text-foreground" style={{ fontWeight: 300 }}>{edit.id ? "Modifier la formule" : "Nouvelle formule"}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
                  <X size={15} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className={lCls}>Nom de la formule *</label>
                  <input value={edit.name || ""} onChange={e => setEdit(p => ({ ...p!, name: e.target.value }))} className={iCls} placeholder="ex: Carte Black x10" />
                </div>

                {/* Description */}
                <div>
                  <label className={lCls}>Description courte</label>
                  <input value={edit.description || ""} onChange={e => setEdit(p => ({ ...p!, description: e.target.value }))} className={iCls} placeholder="Sous-titre visible sur la page tarifs" />
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lCls}>Prix (DH) *</label>
                    <input type="number" value={edit.price || 0} onChange={e => setEdit(p => ({ ...p!, price: +e.target.value }))} className={iCls} />
                  </div>
                  <div>
                    <label className={lCls}>Prix barré (DH)</label>
                    <input type="number" value={edit.original_price || ""} onChange={e => setEdit(p => ({ ...p!, original_price: +e.target.value || null }))} className={iCls} placeholder="Optionnel" />
                  </div>
                </div>

                {/* Sessions + validity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lCls}>Nb séances incluses</label>
                    <input type="number" value={edit.sessions_included || ""} onChange={e => setEdit(p => ({ ...p!, sessions_included: +e.target.value || null }))} className={iCls} placeholder="ex: 10" />
                  </div>
                  <div>
                    <label className={lCls}>Validité (jours)</label>
                    <input type="number" value={edit.validity_days || ""} onChange={e => setEdit(p => ({ ...p!, validity_days: +e.target.value || null }))} className={iCls} placeholder="ex: 90" />
                  </div>
                </div>

                {/* Sort order */}
                <div>
                  <label className={lCls}>Ordre d'affichage</label>
                  <input type="number" value={edit.sort_order || 0} onChange={e => setEdit(p => ({ ...p!, sort_order: +e.target.value }))} className={iCls} />
                </div>

                {/* CTA type — replaces cta_link completely */}
                <div>
                  <label className={lCls}>Action au clic</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setEdit(p => ({ ...p!, cta_text: "payzone" }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-body text-[11px] tracking-[0.1em] uppercase transition-all ${(edit.cta_text === "payzone" || !edit.cta_text || edit.cta_text === "Réserver") ? "border-terra bg-terra/10 text-terra" : "border-border text-muted-foreground hover:border-terra/30"}`}
                      style={{ fontWeight: 500 }}
                    >
                      <Zap size={13} /> Payer en ligne (Payzone)
                    </button>
                    <button
                      onClick={() => setEdit(p => ({ ...p!, cta_text: "pack_request" }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-body text-[11px] tracking-[0.1em] uppercase transition-all ${edit.cta_text === "pack_request" ? "border-[#25D366]/50 bg-[#25D366]/10 text-[#128C7E]" : "border-border text-muted-foreground hover:border-terra/30"}`}
                      style={{ fontWeight: 500 }}
                    >
                      <MessageSquare size={13} /> Demande code sur place
                    </button>
                  </div>
                  <p className="font-body text-[10px] text-muted-foreground mt-1.5">
                    {edit.cta_text === "pack_request"
                      ? "Crée une demande de code à valider manuellement par l'admin."
                      : "Redirige vers Payzone pour paiement en ligne instantané."}
                  </p>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6 py-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${edit.is_popular ? "bg-terra" : "bg-secondary"}`} onClick={() => setEdit(p => ({ ...p!, is_popular: !p?.is_popular }))}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${edit.is_popular ? "left-5" : "left-0.5"}`} />
                    </div>
                    <span className="font-body text-[12px] text-foreground" style={{ fontWeight: 300 }}>Populaire ★</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${edit.is_active !== false ? "bg-terra" : "bg-secondary"}`} onClick={() => setEdit(p => ({ ...p!, is_active: p?.is_active === false ? true : false }))}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${edit.is_active !== false ? "left-5" : "left-0.5"}`} />
                    </div>
                    <span className="font-body text-[12px] text-foreground" style={{ fontWeight: 300 }}>Actif</span>
                  </label>
                </div>

                {/* Features */}
                <div>
                  <label className={lCls}>Avantages inclus</label>
                  <div className="space-y-1 mb-2">
                    {(edit.features || []).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                        <Check size={11} className="text-terra shrink-0" />
                        <span className="font-body text-[12px] text-foreground flex-1" style={{ fontWeight: 300 }}>{f}</span>
                        <button onClick={() => setEdit(p => ({ ...p!, features: (p?.features || []).filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newFeature} onChange={e => setNewFeature(e.target.value)} className={iCls} placeholder="Ajouter un avantage (Entrée pour valider)"
                      onKeyDown={e => { if (e.key === "Enter" && newFeature) { setEdit(p => ({ ...p!, features: [...(p?.features || []), newFeature] })); setNewFeature(""); } }} />
                    <button onClick={() => { if (newFeature) { setEdit(p => ({ ...p!, features: [...(p?.features || []), newFeature] })); setNewFeature(""); } }}
                      className="px-4 bg-terra/10 text-terra rounded-xl font-body text-xl font-light hover:bg-terra/20 transition-colors">
                      +
                    </button>
                  </div>
                </div>

                {/* Save */}
                <div className="flex gap-3 pt-2 border-t border-border">
                  <button onClick={save} className="flex-1 bg-terra text-warm-white py-3 rounded-2xl font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra/90 transition-colors" style={{ fontWeight: 500 }}>
                    {edit.id ? "Enregistrer les modifications" : "Créer la formule"}
                  </button>
                  <button onClick={() => setShowModal(false)} className="px-5 py-3 rounded-2xl border border-border text-muted-foreground font-body text-[11px] hover:border-terra/30 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
