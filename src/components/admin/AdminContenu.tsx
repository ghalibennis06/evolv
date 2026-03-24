import { useState, useEffect } from "react";
import { Save, RefreshCw } from "lucide-react";
import { adminCall } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const iCls =
  "w-full bg-secondary border border-border px-3 py-2.5 font-body text-[13px] text-foreground focus:border-terra outline-none rounded-xl";
const lCls = "font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5 block";
const btn1 =
  "bg-terra text-warm-white px-5 py-2.5 rounded-full font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors flex items-center gap-2";

// ── DEFAULT CONTENT — restored from original site ─────────────────
const DEFAULTS: Record<string, Record<string, any>> = {
  announcements: {
    text: "Nouveaux créneaux disponibles — Réservez dès maintenant !",
    link: "/planning",
    is_active: false,
  },
  hero: {
    tagline: "Reformer Pilates",
    subline: "Mouvement · Équilibre · Bien-être",
    location: "El Menzeh · Rabat",
  },
  studio: {
    page_title: "Notre Studio",
    page_subtitle: "Un espace pour se reconnecter à soi",
    philosophy_label: "Notre philosophie",
    story_title: "L'histoire du Circle",
    story_body:
      "The Circle est né d'une envie simple : créer un espace où l'on vient se reconnecter à soi. Un studio boutique à Rabat dédié au mouvement conscient, à l'équilibre et au bien-être.\n\nNous proposons des séances en petits groupes de 13 personnes maximum, afin de garantir un accompagnement attentif, précis et sécurisé.\n\nDes cours post-natal et Maman & Bébé sont également proposés pour accompagner les jeunes mamans dans une reprise douce et bienveillante.",
    values_title: "Nos valeurs",
    value_1_title: "Mouvement conscient",
    value_1_body:
      "Chaque séance est une invitation à écouter son corps, comprendre ses limites et les dépasser avec bienveillance.",
    value_2_title: "Petits groupes",
    value_2_body: "Un maximum de 13 participants par cours pour un suivi personnalisé et une atmosphère intime.",
    value_3_title: "Expertise",
    value_3_body: "Des coachs certifiés, passionnés, qui conjuguent rigueur pédagogique et chaleur humaine.",
    equipment_title: "Notre équipement",
    equipment_body:
      "4 Reformers Pilates de dernière génération, 2 Springwall, tapis premium et accessoires professionnels.",
    closing: "Rejoignez la communauté The Circle — et commencez votre transformation.",
  },
  contact: {
    address: "El Menzeh, Rabat",
    phone: "+212 6XX XXX XXX",
    email: "hello@thecircle.ma",
    hours_weekday: "Lundi – Vendredi : 9h – 21h",
    hours_saturday: "Samedi : 9h – 18h",
    hours_sunday: "Dimanche : 10h – 18h",
    instagram: "@thecircle.ma",
    maps_link: "https://maps.google.com",
  },
};

// ── Section schema ────────────────────────────────────────────────
const sections = [
  {
    key: "announcements",
    label: "🔔 Bandeau d'annonce",
    fields: [
      { name: "text", label: "Texte du bandeau", type: "text" as const },
      { name: "link", label: "Lien (optionnel)", type: "text" as const },
      { name: "is_active", label: "Actif", type: "toggle" as const },
    ],
  },
  {
    key: "hero",
    label: "🏠 Hero — Page d'accueil",
    fields: [
      { name: "tagline", label: "Tagline principale", type: "text" as const },
      { name: "subline", label: "Sous-titre", type: "text" as const },
      { name: "location", label: "Lieu", type: "text" as const },
    ],
  },
  {
    key: "studio",
    label: "🏛️ Page Studios (À propos)",
    fields: [
      { name: "page_title", label: "Titre de la page", type: "text" as const },
      { name: "page_subtitle", label: "Sous-titre", type: "text" as const },
      { name: "philosophy_label", label: "Label philosophie", type: "text" as const },
      { name: "story_title", label: "Titre histoire", type: "text" as const },
      { name: "story_body", label: "Texte histoire", type: "textarea" as const },
      { name: "values_title", label: "Titre section valeurs", type: "text" as const },
      { name: "value_1_title", label: "Valeur 1 — Titre", type: "text" as const },
      { name: "value_1_body", label: "Valeur 1 — Texte", type: "textarea" as const },
      { name: "value_2_title", label: "Valeur 2 — Titre", type: "text" as const },
      { name: "value_2_body", label: "Valeur 2 — Texte", type: "textarea" as const },
      { name: "value_3_title", label: "Valeur 3 — Titre", type: "text" as const },
      { name: "value_3_body", label: "Valeur 3 — Texte", type: "textarea" as const },
      { name: "equipment_title", label: "Titre équipements", type: "text" as const },
      { name: "equipment_body", label: "Texte équipements", type: "textarea" as const },
      { name: "closing", label: "Phrase de clôture", type: "text" as const },
    ],
  },
  {
    key: "contact",
    label: "📍 Page Contact",
    fields: [
      { name: "address", label: "Adresse", type: "text" as const },
      { name: "phone", label: "Téléphone", type: "text" as const },
      { name: "email", label: "Email", type: "text" as const },
      { name: "hours_weekday", label: "Horaires semaine", type: "text" as const },
      { name: "hours_saturday", label: "Horaires samedi", type: "text" as const },
      { name: "hours_sunday", label: "Horaires dimanche", type: "text" as const },
      { name: "instagram", label: "Instagram handle", type: "text" as const },
      { name: "maps_link", label: "Lien Google Maps", type: "text" as const },
    ],
  },
];

export function AdminContenu() {
  const [data, setData] = useState<Record<string, Record<string, any>>>(DEFAULTS);
  const [saving, setSaving] = useState<string | null>(null);
  const [emailFrom, setEmailFrom] = useState({ name: "The Circle Studio", email: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminCall({ type: "site_content" });
        const map: Record<string, Record<string, any>> = { ...DEFAULTS };
        (res.data || []).forEach((row: any) => {
          if (row.content && typeof row.content === "object")
            map[row.section] = { ...DEFAULTS[row.section], ...row.content };
        });
        setData(map);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    supabase.from("site_content")
      .select("key,value")
      .eq("section", "notifications")
      .then(({ data }) => {
        if (data) {
          const fromName = (data as any[]).find((r: any) => r.key === "from_name")?.value;
          const fromEmail = (data as any[]).find((r: any) => r.key === "from_email")?.value;
          if (fromName) setEmailFrom(e => ({ ...e, name: fromName }));
          if (fromEmail) setEmailFrom(e => ({ ...e, email: fromEmail }));
        }
      });
  }, []);

  const saveEmailConfig = async () => {
    await supabase.from("site_content").upsert([
      { section: "notifications", key: "from_name", value: emailFrom.name },
      { section: "notifications", key: "from_email", value: emailFrom.email },
    ], { onConflict: "section,key" });
    toast.success("Configuration email sauvegardée");
  };

  const updateField = (section: string, field: string, value: any) =>
    setData((prev) => ({ ...prev, [section]: { ...(prev[section] || {}), [field]: value } }));

  const saveSection = async (section: string) => {
    setSaving(section);
    try {
      await adminCall({ action: "update_site_content", section, content: data[section] || {} });
      toast.success("Section sauvegardée !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(null);
    }
  };

  const resetSection = (section: string) => {
    if (!confirm("Restaurer le contenu par défaut de cette section ?")) return;
    setData((prev) => ({ ...prev, [section]: { ...DEFAULTS[section] } }));
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Email config */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <h3 className="font-display text-lg text-foreground mb-1" style={{ fontWeight: 300 }}>Email expéditeur</h3>
        <p className="font-body text-[12px] text-muted-foreground mb-5">Adresse Resend pour les confirmations de réservation et activations de pack.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Nom expéditeur</label>
            <input type="text" value={emailFrom.name} onChange={e => setEmailFrom(v => ({ ...v, name: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-terra/40"
              placeholder="The Circle Studio" />
          </div>
          <div>
            <label className="font-body text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Adresse email</label>
            <input type="email" value={emailFrom.email} onChange={e => setEmailFrom(v => ({ ...v, email: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-terra/40"
              placeholder="hello@thecircle.ma" />
          </div>
        </div>
        <button onClick={saveEmailConfig} className="mt-4 px-6 py-2 rounded-full bg-terra text-warm-white font-body text-[11px] tracking-[0.25em] uppercase hover:bg-terra-dark transition-colors" style={{ fontWeight: 500 }}>
          Sauvegarder
        </button>
      </div>

      <div className="bg-terra/8 border border-terra/20 rounded-2xl p-4">
        <p className="font-body text-[12px] text-terra" style={{ fontWeight: 500 }}>
          ✦ Tous les textes du site sont éditables ici. Les modifications s'appliquent immédiatement après sauvegarde.
        </p>
      </div>

      {sections.map((sec) => (
        <div key={sec.key} className="bg-card border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg text-foreground" style={{ fontWeight: 300 }}>
              {sec.label}
            </h3>
            <button
              onClick={() => resetSection(sec.key)}
              className="font-body text-[10px] tracking-widest uppercase text-muted-foreground hover:text-terra transition-colors flex items-center gap-1"
              style={{ fontWeight: 400 }}
            >
              <RefreshCw size={10} /> Défauts
            </button>
          </div>

          <div className="space-y-4">
            {sec.fields.map((f) => (
              <div key={f.name}>
                <label className={lCls}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    value={data[sec.key]?.[f.name] ?? DEFAULTS[sec.key]?.[f.name] ?? ""}
                    onChange={(e) => updateField(sec.key, f.name, e.target.value)}
                    className={iCls + " resize-none min-h-[80px]"}
                    style={{ fontWeight: 300 }}
                  />
                ) : f.type === "toggle" ? (
                  <button
                    onClick={() => updateField(sec.key, f.name, !data[sec.key]?.[f.name])}
                    className="flex items-center gap-3 font-body text-[12px] text-foreground"
                    style={{ fontWeight: 300 }}
                  >
                    <div
                      className={`w-10 h-5 relative rounded-full transition-colors ${data[sec.key]?.[f.name] ? "bg-[#4E9E7A]" : "bg-muted"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${data[sec.key]?.[f.name] ? "left-5" : "left-0.5"}`}
                      />
                    </div>
                    {data[sec.key]?.[f.name] ? "Activé" : "Désactivé"}
                  </button>
                ) : (
                  <input
                    value={data[sec.key]?.[f.name] ?? DEFAULTS[sec.key]?.[f.name] ?? ""}
                    onChange={(e) => updateField(sec.key, f.name, e.target.value)}
                    className={iCls}
                    style={{ fontWeight: 300 }}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => saveSection(sec.key)}
            disabled={saving === sec.key}
            className={btn1 + " mt-5 disabled:opacity-50"}
          >
            {saving === sec.key ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {saving === sec.key ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      ))}
    </div>
  );
}
