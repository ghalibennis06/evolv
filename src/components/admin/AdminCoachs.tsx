import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, X, ChevronUp, ChevronDown, Star } from "lucide-react";
import { adminCall } from "./AdminLayout";
import PhotoUpload from "@/components/PhotoUpload";
import { toast } from "sonner";

interface Coach {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  specialties: string[];
  certifications: string[];
  instagram: string | null;
  is_active: boolean;
  featured_coach: boolean;
  display_order: number;
}

const inputCls =
  "w-full bg-secondary border border-border px-3 py-2.5 font-body text-[13px] text-foreground focus:border-terra outline-none";
const labelCls =
  "font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5 block";
const btnPrimary =
  "bg-terra text-warm-white px-6 py-2.5 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors";
const btnGhost =
  "text-muted-foreground font-body text-[11px] px-4 hover:text-foreground transition-colors";

export function AdminCoachs() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Partial<Coach> | null>(null);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [reordering, setReordering] = useState(false);
  const [draggedCoachId, setDraggedCoachId] = useState<string | null>(null);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCall({ type: "coaches" });
      setCoaches(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveCoach = async () => {
    if (!edit) return;
    try {
      if (edit.id) await adminCall({ action: "update_coach", coachId: edit.id, coach: edit });
      else await adminCall({ action: "create_coach", coach: edit });
      setShowModal(false);
      setEdit(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteCoach = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    try {
      await adminCall({ action: "delete_coach", coachId: id });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const moveCoach = async (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= coaches.length) return;
    setReordering(true);
    const reordered = [...coaches];
    [reordered[index], reordered[newIdx]] = [reordered[newIdx], reordered[index]];
    setCoaches(reordered);
    try {
      await adminCall({
        action: "reorder_coaches",
        orderedIds: reordered.map((c) => c.id),
      });
      toast.success("Ordre mis à jour");
    } catch (err: any) {
      toast.error(err.message);
      fetchData();
    } finally {
      setReordering(false);
    }
  };

  const handleDragStart = (coachId: string) => setDraggedCoachId(coachId);

  const handleDrop = async (targetCoachId: string) => {
    if (!draggedCoachId || draggedCoachId === targetCoachId || reordering) return;
    const from = coaches.findIndex((c) => c.id === draggedCoachId);
    const to = coaches.findIndex((c) => c.id === targetCoachId);
    if (from < 0 || to < 0) return;

    setReordering(true);
    const reordered = [...coaches];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setCoaches(reordered);

    try {
      await adminCall({
        action: "reorder_coaches",
        orderedIds: reordered.map((c) => c.id),
      });
      toast.success("Ordre mis à jour");
    } catch (err: any) {
      toast.error(err.message);
      fetchData();
    } finally {
      setReordering(false);
      setDraggedCoachId(null);
    }
  };

  const toggleFeatured = async (coach: Coach) => {
    const newVal = !coach.featured_coach;
    setCoaches((prev) =>
      prev.map((c) => (c.id === coach.id ? { ...c, featured_coach: newVal } : c))
    );
    try {
      await adminCall({
        action: "toggle_featured_coach",
        coachId: coach.id,
        featured_coach: newVal,
      });
      toast.success(newVal ? `${coach.name} mis en vedette` : `${coach.name} retiré de la vedette`);
    } catch (err: any) {
      toast.error(err.message);
      fetchData();
    }
  };

  if (loading)
    return (
      <p
        className="font-body text-muted-foreground text-center py-20"
        style={{ fontWeight: 200 }}
      >
        Chargement...
      </p>
    );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p
          className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground"
          style={{ fontWeight: 200 }}
        >
          {coaches.length} coachs · Glissez-déposez pour réordonner
        </p>
        <button
          onClick={() => {
            setEdit({
              name: "",
              role: "",
              bio: "",
              photo: null,
              specialties: [],
              certifications: [],
              instagram: null,
              is_active: true,
              featured_coach: false,
              display_order: coaches.length,
            });
            setShowModal(true);
          }}
          className={btnPrimary + " flex items-center gap-2"}
          style={{ borderRadius: "3px" }}
        >
          <Plus size={14} /> Ajouter un coach
        </button>
      </div>

      <div className="space-y-3">
        {coaches.map((coach, index) => (
          <motion.div
            key={coach.id}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            draggable
            onDragStart={() => handleDragStart(coach.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(coach.id)}
            className={`bg-card border ${coach.featured_coach ? "border-terra" : "border-border"} p-5 flex items-center gap-4 ${draggedCoachId === coach.id ? "opacity-60" : ""}`}
            style={{ borderRadius: "8px" }}
          >
            {/* Order controls */}
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => moveCoach(index, "up")}
                disabled={index === 0 || reordering}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-terra hover:border-terra disabled:opacity-20 disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors"
              >
                <ChevronUp size={14} />
              </button>
              <span className="text-center font-body text-[10px] text-muted-foreground" style={{ fontWeight: 200 }}>
                {index + 1}
              </span>
              <button
                onClick={() => moveCoach(index, "down")}
                disabled={index === coaches.length - 1 || reordering}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-terra hover:border-terra disabled:opacity-20 disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Avatar */}
            {coach.photo ? (
              <div
                className="w-14 h-14 overflow-hidden bg-secondary shrink-0"
                style={{ borderRadius: "50%" }}
              >
                <img src={coach.photo} alt={coach.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-14 h-14 bg-terra flex items-center justify-center text-warm-white font-display text-lg shrink-0"
                style={{ borderRadius: "50%", fontWeight: 200 }}
              >
                {coach.name[0]}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display text-lg text-foreground" style={{ fontWeight: 300 }}>
                  {coach.name}
                </p>
                {coach.featured_coach && (
                  <span className="font-body text-[8px] tracking-[0.1em] uppercase text-terra bg-terra/10 px-2 py-0.5 rounded-full" style={{ fontWeight: 400 }}>
                    ★ Featured
                  </span>
                )}
              </div>
              <p className="font-body text-[11px] text-terra" style={{ fontWeight: 200 }}>
                {coach.role}
              </p>
              {coach.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {coach.specialties.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="font-body text-[8px] tracking-[0.1em] uppercase text-terra bg-terra/8 px-2 py-0.5"
                      style={{ borderRadius: "2px", fontWeight: 200 }}
                    >
                      {s}
                    </span>
                  ))}
                  {coach.specialties.length > 4 && (
                    <span className="font-body text-[8px] text-muted-foreground" style={{ fontWeight: 200 }}>
                      +{coach.specialties.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Status + Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`font-body text-[9px] tracking-[0.15em] uppercase px-2 py-1 ${coach.is_active ? "bg-success-light text-success" : "bg-muted text-muted-foreground"}`}
                style={{ borderRadius: "10px", fontWeight: 200 }}
              >
                {coach.is_active ? "Actif" : "Inactif"}
              </span>
              <button
                onClick={() => toggleFeatured(coach)}
                className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${coach.featured_coach ? "border-terra text-terra bg-terra/10" : "border-border text-muted-foreground hover:text-terra hover:border-terra"}`}
                title={coach.featured_coach ? "Retirer de la vedette" : "Mettre en vedette"}
              >
                <Star size={14} fill={coach.featured_coach ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => {
                  setEdit(coach);
                  setShowModal(true);
                }}
                className="font-body text-[10px] text-terra hover:underline"
                style={{ fontWeight: 200 }}
              >
                Modifier
              </button>
              <button
                onClick={() => deleteCoach(coach.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Coach Modal */}
      <AnimatePresence>
        {showModal && edit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              exit={{ y: 16 }}
              className="bg-card w-[520px] max-w-[95vw] max-h-[85vh] overflow-y-auto shadow-2xl"
              style={{ borderRadius: "10px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-7 py-5 border-b border-border flex justify-between items-center">
                <p className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>
                  {edit.id ? "Modifier coach" : "Nouveau coach"}
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground hover:text-terra"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-7 py-5 space-y-4">
                <div>
                  <label className={labelCls}>Photo</label>
                  <PhotoUpload
                    images={edit.photo ? [edit.photo] : []}
                    onImagesChange={(imgs) => setEdit((p) => ({ ...p!, photo: imgs[0] || null }))}
                    maxImages={1}
                    aspectRatio="1/1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nom</label>
                    <input
                      value={edit.name || ""}
                      onChange={(e) => setEdit((p) => ({ ...p!, name: e.target.value }))}
                      className={inputCls}
                      style={{ borderRadius: "4px", fontWeight: 300 }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Rôle</label>
                    <input
                      value={edit.role || ""}
                      onChange={(e) => setEdit((p) => ({ ...p!, role: e.target.value }))}
                      className={inputCls}
                      style={{ borderRadius: "4px", fontWeight: 300 }}
                      placeholder="Instructrice Reformer"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Bio</label>
                  <textarea
                    value={edit.bio || ""}
                    onChange={(e) => setEdit((p) => ({ ...p!, bio: e.target.value }))}
                    className={inputCls + " resize-none h-24"}
                    style={{ borderRadius: "4px", fontWeight: 300 }}
                  />
                </div>
                <div>
                  <label className={labelCls}>Spécialités</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(edit.specialties || []).map((s, i) => (
                      <span
                        key={i}
                        className="font-body text-[9px] text-terra bg-terra/8 px-2 py-1 flex items-center gap-1 cursor-pointer"
                        style={{ borderRadius: "2px", fontWeight: 200 }}
                        onClick={() =>
                          setEdit((p) => ({
                            ...p!,
                            specialties: (p?.specialties || []).filter((_, j) => j !== i),
                          }))
                        }
                      >
                        {s} <X size={10} />
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      className={inputCls}
                      style={{ borderRadius: "4px", fontWeight: 300 }}
                      placeholder="Ajouter..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSpecialty) {
                          setEdit((p) => ({
                            ...p!,
                            specialties: [...(p?.specialties || []), newSpecialty],
                          }));
                          setNewSpecialty("");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newSpecialty) {
                          setEdit((p) => ({
                            ...p!,
                            specialties: [...(p?.specialties || []), newSpecialty],
                          }));
                          setNewSpecialty("");
                        }
                      }}
                      className="text-terra font-body text-[10px]"
                      style={{ fontWeight: 200 }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Instagram</label>
                  <input
                    value={edit.instagram || ""}
                    onChange={(e) => setEdit((p) => ({ ...p!, instagram: e.target.value }))}
                    className={inputCls}
                    style={{ borderRadius: "4px", fontWeight: 300 }}
                    placeholder="@handle"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={edit.is_active ?? true}
                      onChange={(e) => setEdit((p) => ({ ...p!, is_active: e.target.checked }))}
                      className="accent-terra"
                    />
                    <span className="font-body text-[11px] text-foreground" style={{ fontWeight: 300 }}>
                      Actif
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={edit.featured_coach ?? false}
                      onChange={(e) => setEdit((p) => ({ ...p!, featured_coach: e.target.checked }))}
                      className="accent-terra"
                    />
                    <span className="font-body text-[11px] text-foreground" style={{ fontWeight: 300 }}>
                      ★ Featured
                    </span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={saveCoach} className={btnPrimary} style={{ borderRadius: "3px" }}>
                    Enregistrer
                  </button>
                  <button onClick={() => setShowModal(false)} className={btnGhost}>
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
