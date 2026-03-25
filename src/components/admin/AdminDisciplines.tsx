import { useState, useEffect, useRef } from "react";
import { Save, RefreshCw, Plus, Trash2, Pencil, X, Check, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const lCls = "font-body text-[11px] tracking-[0.25em] uppercase text-foreground/70 mb-1.5 block font-medium";
const btn1 = "bg-terra text-white px-5 py-2.5 rounded-full font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors flex items-center gap-2";
const iCls = "w-full bg-secondary border border-border px-3 py-2 font-body text-[13px] text-foreground focus:border-terra outline-none rounded-xl";
const iSmall = "bg-secondary border border-border px-2 py-1.5 font-body text-[12px] text-foreground focus:border-terra outline-none rounded-lg w-full";

interface Course {
  name: string;
  tag: string | null;
  detail: string;
  price?: number;
}

interface Discipline {
  id: string;
  label: string;
  courses?: Course[];
  photo_url?: string;
}

interface Visibility {
  index: string[];
  studio: string[];
}

const DEFAULT_DISCIPLINES: Discipline[] = [
  { id: "reformer", label: "Reformer Pilates", courses: [
    { name: "Reformer Classique", tag: "All Levels", detail: "Travail en profondeur sur le reformer, renforcement et allongement musculaire." },
    { name: "Jumpboard", tag: "Cardio", detail: "Cardio sur reformer avec jumpboard, dynamique et tonifiant." },
  ]},
  { id: "springwall", label: "Reformer + Springwall", courses: [] },
  { id: "yoga", label: "Yoga", courses: [
    { name: "Vinyasa", tag: "Flow", detail: "Enchaînement dynamique synchronisé à la respiration." },
    { name: "Hatha", tag: "Doux", detail: "Postures statiques et travail de conscience corporelle." },
  ]},
  { id: "fitness", label: "Mat & Fitness", courses: [] },
  { id: "maternite", label: "Maternité & Post-natal", courses: [] },
];

const EMPTY_COURSE = (): Course => ({ name: "", tag: "", detail: "" });

export function AdminDisciplines() {
  const [disciplines, setDisciplines] = useState<Discipline[]>(DEFAULT_DISCIPLINES);
  const [visibility, setVisibility] = useState<Visibility>({ index: DEFAULT_DISCIPLINES.map(d => d.id), studio: DEFAULT_DISCIPLINES.map(d => d.id) });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newDiscipline, setNewDiscipline] = useState<Discipline & { rawId: string }>({ rawId: "", id: "", label: "", courses: [], photo_url: "" });
  const [uploadingNew, setUploadingNew] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const newFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File, _id: string): Promise<string | null> => {
    // Storage upload not yet implemented — return a local object URL as a stub
    try {
      return URL.createObjectURL(file);
    } catch {
      toast.error("Upload non disponible. Collez une URL à la place.");
      return null;
    }
  };

  const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = newDiscipline.rawId.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || `disc-${Date.now()}`;
    setUploadingNew(true);
    const url = await uploadPhoto(file, id);
    setUploadingNew(false);
    if (url) {
      setNewDiscipline(p => ({ ...p, photo_url: url }));
      toast.success("Photo uploadée !");
    }
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDiscipline) return;
    setUploadingEdit(true);
    const url = await uploadPhoto(file, editingDiscipline.id);
    setUploadingEdit(false);
    if (url) {
      setEditingDiscipline(p => p ? { ...p, photo_url: url } : p);
      toast.success("Photo uploadée !");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [configData, visData] = await Promise.all([
          api.siteContent.get("disciplines_config").catch(() => null),
          api.siteContent.get("disciplines_visibility").catch(() => null),
        ]);

        if (configData?.content && Array.isArray((configData.content as any).disciplines)) {
          setDisciplines((configData.content as any).disciplines);
        }

        if (visData?.content && typeof visData.content === "object") {
          const raw = visData.content as any;
          const allIds = DEFAULT_DISCIPLINES.map(d => d.id);
          setVisibility({
            index: Array.isArray(raw.index) ? raw.index : allIds,
            studio: Array.isArray(raw.studio) ? raw.studio : allIds,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleVisibility = (page: "index" | "studio", id: string) => {
    setVisibility(prev => {
      const current = prev[page];
      const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      return { ...prev, [page]: next };
    });
  };

  const startEdit = (d: Discipline) => {
    setEditingDiscipline({ ...d, courses: d.courses ? [...d.courses.map(c => ({ ...c }))] : [] });
    setExpandedId(d.id);
  };

  const saveEdit = () => {
    if (!editingDiscipline) return;
    setDisciplines(prev => prev.map(d => d.id === editingDiscipline.id ? editingDiscipline : d));
    setEditingDiscipline(null);
    toast.success("Modifié — pensez à sauvegarder");
  };

  const cancelEdit = () => {
    setEditingDiscipline(null);
  };

  const deleteDiscipline = (id: string) => {
    if (!confirm("Supprimer cette discipline ?")) return;
    setDisciplines(prev => prev.filter(d => d.id !== id));
    setVisibility(prev => ({
      index: prev.index.filter(x => x !== id),
      studio: prev.studio.filter(x => x !== id),
    }));
  };

  const addCourseToEdit = () => {
    if (!editingDiscipline) return;
    setEditingDiscipline({ ...editingDiscipline, courses: [...(editingDiscipline.courses ?? []), EMPTY_COURSE()] });
  };

  const updateCourseInEdit = (idx: number, field: keyof Course, value: string | number) => {
    if (!editingDiscipline) return;
    const courses = [...(editingDiscipline.courses ?? [])];
    courses[idx] = { ...courses[idx], [field]: value };
    setEditingDiscipline({ ...editingDiscipline, courses });
  };

  const removeCourseFromEdit = (idx: number) => {
    if (!editingDiscipline) return;
    const courses = (editingDiscipline.courses ?? []).filter((_, i) => i !== idx);
    setEditingDiscipline({ ...editingDiscipline, courses });
  };

  const addCourseToNew = () => {
    setNewDiscipline(prev => ({ ...prev, courses: [...(prev.courses ?? []), EMPTY_COURSE()] }));
  };

  const updateCourseInNew = (idx: number, field: keyof Course, value: string | number) => {
    const courses = [...(newDiscipline.courses ?? [])];
    courses[idx] = { ...courses[idx], [field]: value };
    setNewDiscipline(prev => ({ ...prev, courses }));
  };

  const removeCourseFromNew = (idx: number) => {
    setNewDiscipline(prev => ({ ...prev, courses: (prev.courses ?? []).filter((_, i) => i !== idx) }));
  };

  const addDiscipline = () => {
    const id = newDiscipline.rawId.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const label = newDiscipline.label.trim();
    if (!id || !label) return toast.error("ID et nom requis");
    if (disciplines.find(d => d.id === id)) return toast.error("Cet ID existe déjà");
    const courses = (newDiscipline.courses ?? []).filter(c => c.name.trim());
    const photo_url = newDiscipline.photo_url || undefined;
    setDisciplines(prev => [...prev, { id, label, courses, photo_url }]);
    setVisibility(prev => ({ index: [...prev.index, id], studio: [...prev.studio, id] }));
    setNewDiscipline({ rawId: "", id: "", label: "", courses: [], photo_url: "" });
    setShowAdd(false);
    toast.success("Discipline ajoutée — pensez à sauvegarder");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.admin.siteContent.upsert("disciplines_config", { disciplines }),
        api.admin.siteContent.upsert("disciplines_visibility", { index: visibility.index, studio: visibility.studio }),
      ]);
      toast.success("Disciplines sauvegardées !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground font-body text-[13px]">
        <RefreshCw size={14} className="animate-spin" /> Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-terra/10 border border-terra/25 rounded-2xl p-4">
        <p className="font-body text-[12px] text-terra" style={{ fontWeight: 500 }}>
          ✦ Gérez les disciplines et leurs cours — noms, tags, descriptions. Contrôlez la visibilité par page.
        </p>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg text-foreground" style={{ fontWeight: 300 }}>Disciplines</h3>
          <button
            onClick={() => { setShowAdd(!showAdd); setExpandedId(null); setEditingDiscipline(null); }}
            className="flex items-center gap-1.5 font-body text-[11px] tracking-[0.2em] uppercase text-terra hover:text-terra-dark border border-terra/30 hover:border-terra px-3 py-1.5 rounded-full transition-all"
            style={{ fontWeight: 500 }}
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="mb-6 p-5 bg-secondary rounded-2xl border border-border space-y-4">
            <p className={lCls}>Nouvelle discipline</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lCls}>ID (unique)</label>
                <input value={newDiscipline.rawId} onChange={e => setNewDiscipline(p => ({ ...p, rawId: e.target.value }))} className={iCls} placeholder="ex: boxe" />
              </div>
              <div>
                <label className={lCls}>Nom affiché</label>
                <input value={newDiscipline.label} onChange={e => setNewDiscipline(p => ({ ...p, label: e.target.value }))} className={iCls} placeholder="Boxe & Cardio" />
              </div>
            </div>
            <div>
              <label className={lCls}>Photo</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newDiscipline.photo_url || ""}
                  onChange={e => setNewDiscipline(p => ({ ...p, photo_url: e.target.value }))}
                  placeholder="https://... ou utilisez Upload →"
                  className={iCls + " flex-1"}
                />
                <button
                  type="button"
                  onClick={() => newFileRef.current?.click()}
                  disabled={uploadingNew}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-muted-foreground hover:border-terra hover:text-terra transition-all shrink-0 disabled:opacity-50"
                  title="Uploader une image"
                >
                  {uploadingNew ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                </button>
                <input ref={newFileRef} type="file" accept="image/*" className="hidden" onChange={handleNewFileUpload} />
              </div>
              {newDiscipline.photo_url && (
                <img src={newDiscipline.photo_url} alt="preview" className="mt-2 w-full h-28 object-cover rounded-xl opacity-75" />
              )}
            </div>

            {/* Courses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={lCls + " mb-0"}>Cours de cette discipline</label>
                <button onClick={addCourseToNew} className="text-terra hover:text-terra-dark font-body text-[10px] tracking-widest uppercase flex items-center gap-1" style={{ fontWeight: 500 }}>
                  <Plus size={10} /> Ajouter un cours
                </button>
              </div>
              {(newDiscipline.courses ?? []).map((course, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_70px_2fr_80px_auto] gap-2 mb-2 items-start">
                  <input value={course.name} onChange={e => updateCourseInNew(idx, "name", e.target.value)} className={iSmall} placeholder="Nom du cours" />
                  <input value={course.tag ?? ""} onChange={e => updateCourseInNew(idx, "tag", e.target.value)} className={iSmall} placeholder="Tag" />
                  <input value={course.detail} onChange={e => updateCourseInNew(idx, "detail", e.target.value)} className={iSmall} placeholder="Description courte" />
                  <input
                    type="number"
                    value={course.price ?? ""}
                    onChange={e => updateCourseInNew(idx, "price", e.target.value === "" ? (undefined as any) : Number(e.target.value))}
                    className={iSmall}
                    placeholder="Prix MAD"
                    min={0}
                  />
                  <button onClick={() => removeCourseFromNew(idx)} className="text-destructive hover:text-destructive/80 mt-1"><X size={13} /></button>
                </div>
              ))}
              {(newDiscipline.courses ?? []).length === 0 && (
                <p className="font-body text-[11px] text-muted-foreground italic">Aucun cours — cliquez "Ajouter un cours" pour en créer</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={addDiscipline} className={btn1}><Plus size={13} /> Créer la discipline</button>
              <button onClick={() => setShowAdd(false)} className="font-body text-[11px] text-muted-foreground hover:text-foreground px-3">Annuler</button>
            </div>
          </div>
        )}

        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_80px_80px] gap-2 mb-3 px-1">
          <span className={lCls}>Discipline</span>
          <span className={lCls + " w-20 text-center"}>Actions</span>
          <span className={lCls + " text-center"}>Index</span>
          <span className={lCls + " text-center"}>Studio</span>
        </div>
        <div className="h-px bg-border mb-2" />

        <div className="space-y-1">
          {disciplines.map(discipline => {
            const onIndex = visibility.index.includes(discipline.id);
            const onStudio = visibility.studio.includes(discipline.id);
            const isExpanded = expandedId === discipline.id;
            const isEditing = editingDiscipline?.id === discipline.id;

            return (
              <div key={discipline.id} className="border-b border-border last:border-0">
                {/* Main row */}
                <div className="grid grid-cols-[1fr_auto_80px_80px] gap-2 items-center py-2.5 px-1">
                  <div>
                    <span className="font-body text-[13px] text-foreground" style={{ fontWeight: 400 }}>{discipline.label}</span>
                    <span className="font-body text-[10px] text-muted-foreground ml-2">#{discipline.id}</span>
                    {(discipline.courses?.length ?? 0) > 0 && (
                      <span className="ml-2 font-body text-[9px] tracking-wider uppercase text-terra/60" style={{ fontWeight: 500 }}>
                        {discipline.courses!.length} cours
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 w-20 justify-center">
                    <button
                      onClick={() => { setExpandedId(isExpanded ? null : discipline.id); if (isEditing) cancelEdit(); }}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-terra transition-colors"
                      title="Voir / éditer les cours"
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button onClick={() => startEdit(discipline)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-terra transition-colors"><Pencil size={12} /></button>
                    <button onClick={() => deleteDiscipline(discipline.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={12} /></button>
                  </div>
                  <div className="flex justify-center">
                    <button type="button" onClick={() => toggleVisibility("index", discipline.id)}>
                      <div className={`w-10 h-5 relative rounded-full transition-colors ${onIndex ? "bg-terra" : "bg-muted"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${onIndex ? "left-5" : "left-0.5"}`} />
                      </div>
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <button type="button" onClick={() => toggleVisibility("studio", discipline.id)}>
                      <div className={`w-10 h-5 relative rounded-full transition-colors ${onStudio ? "bg-terra" : "bg-muted"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${onStudio ? "left-5" : "left-0.5"}`} />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Expanded edit panel */}
                {isExpanded && (
                  <div className="mx-1 mb-3 p-4 bg-secondary rounded-xl border border-border space-y-3">
                    {isEditing ? (
                      <>
                        {/* Edit name */}
                        <div>
                          <label className={lCls}>Nom de la discipline</label>
                          <input
                            value={editingDiscipline!.label}
                            onChange={e => setEditingDiscipline(p => p ? { ...p, label: e.target.value } : p)}
                            className={iCls}
                          />
                        </div>

                        {/* Photo */}
                        <div>
                          <label className={lCls}>Photo</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={editingDiscipline!.photo_url || ""}
                              onChange={e => setEditingDiscipline(p => p ? { ...p, photo_url: e.target.value } : p)}
                              placeholder="https://... ou utilisez Upload →"
                              className={iCls + " flex-1"}
                            />
                            <button
                              type="button"
                              onClick={() => editFileRef.current?.click()}
                              disabled={uploadingEdit}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-muted-foreground hover:border-terra hover:text-terra transition-all shrink-0 disabled:opacity-50"
                              title="Uploader une image"
                            >
                              {uploadingEdit ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                            </button>
                            <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={handleEditFileUpload} />
                          </div>
                          {editingDiscipline!.photo_url && (
                            <img src={editingDiscipline!.photo_url} alt="preview" className="mt-2 w-full h-28 object-cover rounded-xl opacity-75" />
                          )}
                        </div>

                        {/* Courses */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className={lCls + " mb-0"}>Cours</label>
                            <button onClick={addCourseToEdit} className="text-terra hover:text-terra-dark font-body text-[10px] tracking-widest uppercase flex items-center gap-1" style={{ fontWeight: 500 }}>
                              <Plus size={10} /> Cours
                            </button>
                          </div>
                          {(editingDiscipline!.courses ?? []).length === 0 && (
                            <p className="font-body text-[11px] text-muted-foreground italic mb-2">Aucun cours</p>
                          )}
                          {(editingDiscipline!.courses ?? []).map((course, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_70px_2fr_80px_auto] gap-2 mb-2 items-start">
                              <input value={course.name} onChange={e => updateCourseInEdit(idx, "name", e.target.value)} className={iSmall} placeholder="Nom du cours" />
                              <input value={course.tag ?? ""} onChange={e => updateCourseInEdit(idx, "tag", e.target.value)} className={iSmall} placeholder="Tag" />
                              <input value={course.detail} onChange={e => updateCourseInEdit(idx, "detail", e.target.value)} className={iSmall} placeholder="Description" />
                              <input
                                type="number"
                                value={course.price ?? ""}
                                onChange={e => updateCourseInEdit(idx, "price", e.target.value === "" ? (undefined as any) : Number(e.target.value))}
                                className={iSmall}
                                placeholder="Prix MAD"
                                min={0}
                              />
                              <button onClick={() => removeCourseFromEdit(idx)} className="text-destructive hover:text-destructive/80 mt-1"><X size={13} /></button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button onClick={saveEdit} className={btn1}><Check size={13} /> Appliquer</button>
                          <button onClick={cancelEdit} className="font-body text-[11px] text-muted-foreground hover:text-foreground px-3">Annuler</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 500 }}>Cours de la discipline</p>
                        {(discipline.courses?.length ?? 0) === 0 ? (
                          <p className="font-body text-[12px] text-muted-foreground italic">Aucun cours configuré — cliquez <span className="text-terra">Éditer</span> pour en ajouter.</p>
                        ) : (
                          <div className="space-y-2">
                            {discipline.courses!.map((c, i) => (
                              <div key={i} className="flex items-start gap-3 p-2.5 bg-card rounded-lg border border-border">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-body text-[13px] text-foreground" style={{ fontWeight: 400 }}>{c.name}</span>
                                    {c.tag && <span className="font-body text-[9px] tracking-widest uppercase text-terra border border-terra/30 px-1.5 py-0.5 rounded" style={{ fontWeight: 500 }}>{c.tag}</span>}
                                    {c.price != null && <span className="font-body text-[10px] text-terra font-semibold">{c.price} MAD</span>}
                                  </div>
                                  {c.detail && <p className="font-body text-[11px] text-muted-foreground mt-0.5">{c.detail}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <button onClick={() => startEdit(discipline)} className="font-body text-[10px] tracking-widest uppercase text-terra flex items-center gap-1 mt-1" style={{ fontWeight: 500 }}>
                          <Pencil size={10} /> Éditer les cours
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={handleSave} disabled={saving} className={btn1 + " mt-6 disabled:opacity-50"}>
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? "Sauvegarde..." : "Sauvegarder tout"}
        </button>
      </div>
    </div>
  );
}
