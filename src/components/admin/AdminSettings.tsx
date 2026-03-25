/**
 * AdminSettings — Phase 5 :
 *  • Journal d'activité connecté à admin_journal via adminCall
 *  • Accès & Comptes : inviter coachs / staff, gérer les rôles
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Trash2,
  Shield,
  RefreshCw,
  Clock,
  User,
  LogIn,
  LogOut,
  Edit3,
  Plus,
  Minus,
  Check,
  X,
  Search,
  Filter,
  Star,
  Ban,
  Ticket,
  Package,
  CreditCard,
  MessageCircle,
  ChevronDown,
  Mail,
  Phone,
  Save,
} from "lucide-react";
import { api } from "@/lib/api";
import { adminCall } from "./AdminLayout";
import { toast } from "sonner";
import MeridianLogo from "@/components/brand/MeridianLogo";

const iCls =
  "w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[13px] text-foreground focus:border-terra outline-none";
const btn1 =
  "bg-terra text-warm-white px-5 py-2.5 rounded-full font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors flex items-center gap-2 disabled:opacity-50";

interface UserRole {
  user_id: string;
  role: string;
  email?: string;
  created_at: string;
}
interface JournalEntry {
  id: string;
  action_by: string;
  action_type: string;
  details: any;
  created_at: string;
}

const ACTION_ICONS: Record<string, any> = {
  login: LogIn,
  logout: LogOut,
  create_session: Plus,
  update_session: Edit3,
  delete_session: Minus,
  bulk_create_sessions: Package,
  add_participant: UserPlus,
  remove_participant: Trash2,
  update_coach: Edit3,
  create_coach: Plus,
  delete_coach: Trash2,
  reorder_coaches: Star,
  toggle_featured_coach: Star,
  generate_pack: Ticket,
  adjust_pack_credits: CreditCard,
  deactivate_pack: Ban,
  delete_pack: Trash2,
  add_client_note: MessageCircle,
  create_pricing: Plus,
  update_pricing: Edit3,
  delete_pricing: Trash2,
  create_product: Plus,
  update_product: Edit3,
  delete_product: Trash2,
};

const ACTION_LABELS: Record<string, string> = {
  login: "Connexion",
  logout: "Déconnexion",
  create_session: "Création de session",
  update_session: "Modification de session",
  delete_session: "Suppression de session",
  bulk_create_sessions: "Génération semaine type",
  add_participant: "Ajout participant",
  remove_participant: "Retrait participant",
  update_coach: "Modification coach",
  create_coach: "Nouveau coach",
  delete_coach: "Suppression coach",
  reorder_coaches: "Réordonnancement coachs",
  toggle_featured_coach: "Toggle coach vedette",
  generate_pack: "Génération de pack",
  adjust_pack_credits: "Ajustement crédits",
  deactivate_pack: "Désactivation pack",
  delete_pack: "Suppression pack",
  add_client_note: "Note client ajoutée",
  create_pricing: "Création tarif",
  update_pricing: "Modification tarif",
  delete_pricing: "Suppression tarif",
  create_product: "Création produit",
  update_product: "Modification produit",
  delete_product: "Suppression produit",
};

interface StudioConfig {
  email_studio: string;
  email_cc: string;
  email_from_name: string;
  whatsapp_number: string;
  whatsapp_display: string;
}

const defaultConfig: StudioConfig = {
  email_studio: "",
  email_cc: "",
  email_from_name: "EVØLV Studio",
  whatsapp_number: "",
  whatsapp_display: "WhatsApp Studio",
};

export function AdminSettings() {
  const [tab, setTab] = useState<"access" | "journal" | "params">("journal");
  const [users, setUsers] = useState<UserRole[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState<"admin" | "coach">("coach");
  const [sending, setSending] = useState(false);
  const [journalSearch, setJournalSearch] = useState("");
  const [journalFilter, setJournalFilter] = useState<string>("all");
  const [config, setConfig] = useState<StudioConfig>(defaultConfig);
  const [configSaving, setConfigSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      // Users managed via backend — use admin call
      const res = await adminCall({ action: "get_users" }).catch(() => ({ data: [] }));
      setUsers(res?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadJournal = useCallback(async () => {
    try {
      const res = await adminCall({ action: "get_journal", limit: 200 });
      setJournal(res.journal || []);
    } catch (e) {
      console.error(e);
      setJournal([]);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const data = await api.siteContent.get("studio_config").catch(() => null);
      if (data?.content) setConfig({ ...defaultConfig, ...(data.content as Partial<StudioConfig>) });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      await api.admin.siteContent.upsert("studio_config", config);
      toast.success("Paramètres sauvegardés");
    } catch (e: any) {
      toast.error(e.message || "Erreur de sauvegarde");
    } finally {
      setConfigSaving(false);
    }
  };

  useEffect(() => {
    Promise.all([loadUsers(), loadJournal(), loadConfig()]).finally(() => setLoading(false));
  }, [loadUsers, loadJournal, loadConfig]);

  const inviteUser = async () => {
    if (!invEmail.trim()) return;
    setSending(true);
    try {
      await adminCall({ action: "invite_user", email: invEmail.trim(), role: invRole });
      toast.success(`Invitation envoyée à ${invEmail}`);
      setInvEmail("");
    } catch (e: any) {
      toast.error(e.message || "Erreur d'invitation");
    } finally {
      setSending(false);
    }
  };

  const removeUser = async (userId: string) => {
    if (!confirm("Révoquer l'accès ?")) return;
    await adminCall({ action: "remove_user", user_id: userId }).catch(() => {});
    loadUsers();
  };

  // Filtered journal
  const filteredJournal = journal.filter((entry) => {
    const q = journalSearch.toLowerCase();
    const matchSearch =
      !q ||
      (ACTION_LABELS[entry.action_type] || entry.action_type).toLowerCase().includes(q) ||
      (entry.action_by || "").toLowerCase().includes(q) ||
      JSON.stringify(entry.details || {}).toLowerCase().includes(q);
    const matchFilter = journalFilter === "all" || entry.action_type === journalFilter;
    return matchSearch && matchFilter;
  });

  // Unique action types for filter
  const actionTypes = [...new Set(journal.map((e) => e.action_type))].sort();

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={18} className="animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Tab switcher */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: "journal", label: "📋 Journal" },
            { key: "access", label: "🔐 Accès" },
            { key: "params", label: "⚙️ Paramètres" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-body text-[11px] tracking-widest uppercase px-5 py-2.5 rounded-full transition-all border ${tab === t.key ? "bg-terra text-warm-white border-terra" : "border-border text-muted-foreground hover:border-terra/30"}`}
            style={{ fontWeight: 500 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ACCESS TAB ── */}
      {tab === "access" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg text-foreground mb-4" style={{ fontWeight: 300 }}>
              Inviter un membre de l'équipe
            </h3>
            <div className="flex gap-3">
              <input
                value={invEmail}
                onChange={(e) => setInvEmail(e.target.value)}
                className={iCls + " flex-1"}
                placeholder="email@evolv.ma"
              />
              <select
                value={invRole}
                onChange={(e) => setInvRole(e.target.value as any)}
                className={iCls + " w-32 cursor-pointer"}
              >
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={inviteUser} disabled={sending || !invEmail.trim()} className={btn1}>
                {sending ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={13} />}
                Inviter
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>
                Comptes actifs ({users.length})
              </p>
            </div>
            {users.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <MeridianLogo size={32} variant="sand" animate className="mx-auto mb-3 opacity-30" />
                <p className="font-body text-[13px] text-muted-foreground">Aucun compte configuré</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {users.map((u) => (
                  <div key={u.user_id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-terra/10 flex items-center justify-center shrink-0">
                      <User size={15} className="text-terra" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[13px] text-foreground font-medium truncate">{u.email || u.user_id}</p>
                      <p className="font-body text-[10px] text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span
                      className={`font-body text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-terra/15 text-terra" : "bg-secondary text-muted-foreground"}`}
                      style={{ fontWeight: 600 }}
                    >
                      {u.role === "admin" ? "Admin" : "Coach"}
                    </span>
                    <button onClick={() => removeUser(u.user_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PARAMS TAB ── */}
      {tab === "params" && (
        <div className="space-y-5">
          {/* Email config */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={14} className="text-terra" />
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 500 }}>Adresses email</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Email principal du studio</label>
                <input
                  value={config.email_studio}
                  onChange={e => setConfig(c => ({ ...c, email_studio: e.target.value }))}
                  className={iCls}
                  placeholder="contact@evolv.ma"
                  type="email"
                />
              </div>
              <div>
                <label className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Email CC (copie)</label>
                <input
                  value={config.email_cc}
                  onChange={e => setConfig(c => ({ ...c, email_cc: e.target.value }))}
                  className={iCls}
                  placeholder="admin@evolv.ma"
                  type="email"
                />
              </div>
              <div>
                <label className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Nom expéditeur (From name)</label>
                <input
                  value={config.email_from_name}
                  onChange={e => setConfig(c => ({ ...c, email_from_name: e.target.value }))}
                  className={iCls}
                  placeholder="EVØLV Studio"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp config */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone size={14} className="text-[#25D366]" />
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 500 }}>WhatsApp</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Numéro WhatsApp (format international)</label>
                <input
                  value={config.whatsapp_number}
                  onChange={e => setConfig(c => ({ ...c, whatsapp_number: e.target.value }))}
                  className={iCls}
                  placeholder="212600000000"
                />
                <p className="font-body text-[10px] text-muted-foreground mt-1">Sans + ni espaces. Ex: 212612345678</p>
              </div>
              <div>
                <label className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Texte affiché dans le footer</label>
                <input
                  value={config.whatsapp_display}
                  onChange={e => setConfig(c => ({ ...c, whatsapp_display: e.target.value }))}
                  className={iCls}
                  placeholder="WhatsApp Studio"
                />
              </div>
            </div>
          </div>

          <button onClick={saveConfig} disabled={configSaving} className={btn1 + " w-fit"}>
            {configSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {configSaving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      )}

      {/* ── JOURNAL TAB ── */}
      {tab === "journal" && (
        <div className="space-y-4">
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                className={iCls + " pl-9"}
                placeholder="Rechercher dans le journal..."
              />
            </div>
            <select
              value={journalFilter}
              onChange={(e) => setJournalFilter(e.target.value)}
              className={iCls + " sm:w-48 cursor-pointer"}
            >
              <option value="all">Tous les types</option>
              {actionTypes.map((at) => (
                <option key={at} value={at}>
                  {ACTION_LABELS[at] || at}
                </option>
              ))}
            </select>
            <button onClick={loadJournal} className="text-muted-foreground hover:text-terra transition-colors p-2.5">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-terra" />
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>
                  Journal ({filteredJournal.length})
                </p>
              </div>
            </div>

            {filteredJournal.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <MeridianLogo size={40} variant="sand" animate spinDuration={12} className="mx-auto mb-4 opacity-30" />
                <p className="font-body text-[13px] text-muted-foreground">
                  {journal.length === 0 ? "Aucune activité enregistrée" : "Aucun résultat pour ce filtre"}
                </p>
                {journal.length === 0 && (
                  <p className="font-body text-[11px] text-muted-foreground/60 mt-2 max-w-xs mx-auto" style={{ fontWeight: 300 }}>
                    Les créations/modifications de sessions, participants et packs seront automatiquement journalisées ici.
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {filteredJournal.map((entry) => {
                  const Icon = ACTION_ICONS[entry.action_type] || Edit3;
                  const label = ACTION_LABELS[entry.action_type] || entry.action_type;
                  const details = entry.details;
                  const detailStr = details
                    ? Object.entries(details)
                        .filter(([k]) => k !== "action_type")
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")
                    : null;
                  return (
                    <div key={entry.id} className="px-6 py-3.5 flex items-start gap-3 hover:bg-secondary/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-terra/8 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={13} className="text-terra" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[13px] text-foreground font-medium">{label}</p>
                        {detailStr && (
                          <p className="font-body text-[11px] text-muted-foreground truncate">{detailStr}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-body text-[10px] text-terra bg-terra/8 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
                            {entry.action_by || "admin"}
                          </span>
                          <span className="font-body text-[10px] text-muted-foreground">
                            {new Date(entry.created_at).toLocaleString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
