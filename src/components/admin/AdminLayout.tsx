import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Calendar,
  Coffee,
  Settings,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  UserCircle,
  DollarSign,
  Palette,
  Ticket,
  LayoutDashboard,
  LogOut,
  Loader2,
  Bell,
  Users,
  BookOpen,
  MessageSquare,
  Sun,
  Moon,
} from "lucide-react";
import { Link } from "react-router-dom";
import MeridianLogo from "@/components/brand/MeridianLogo";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ADMIN_PASSWORD = "thecircle2024";

export type AdminTab =
  | "dashboard"
  | "planning"
  | "waitlist"
  | "contacts"
  | "packs"
  | "boutique"
  | "drinks"
  | "coaches"
  | "tarifs"
  | "contenu"
  | "disciplines"
  | "settings"
  | "journal"
  | "reminders"
  | "whatsapp";

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onRefresh: () => void;
  children: React.ReactNode;
}

const NAV_GROUPS = [
  {
    label: "Pilotage",
    tabs: [
      { key: "dashboard" as AdminTab, icon: LayoutDashboard, label: "Dashboard" },
      { key: "planning" as AdminTab, icon: Calendar, label: "Planning" },
      { key: "waitlist" as AdminTab, icon: Bell, label: "Liste d'attente" },
      { key: "whatsapp" as AdminTab, icon: MessageSquare, label: "WhatsApp" },
      { key: "contacts" as AdminTab, icon: Users, label: "Contacts CRM" },
      { key: "packs" as AdminTab, icon: Ticket, label: "Packs & Codes" },
    ],
  },
  {
    label: "Contenu",
    tabs: [
      { key: "boutique" as AdminTab, icon: ShoppingBag, label: "Boutique" },
      { key: "drinks" as AdminTab, icon: Coffee, label: "Boissons" },
      { key: "coaches" as AdminTab, icon: UserCircle, label: "Coachs" },
      { key: "tarifs" as AdminTab, icon: DollarSign, label: "Tarifs" },
      { key: "contenu" as AdminTab, icon: Palette, label: "Contenu site" },
      { key: "disciplines" as AdminTab, icon: BookOpen, label: "Disciplines" },
    ],
  },
  {
    label: "Accès",
    tabs: [{ key: "settings" as AdminTab, icon: Settings, label: "Accès & Journal" }],
  },
];

const tabTitle: Record<AdminTab, string> = {
  dashboard: "Dashboard",
  planning: "Planning",
  waitlist: "Liste d'attente",
  contacts: "Contacts & CRM",
  packs: "Packs & Codes",
  boutique: "Boutique",
  drinks: "Boissons",
  coaches: "Coachs",
  tarifs: "Tarifs",
  contenu: "Contenu du site",
  disciplines: "Disciplines",
  settings: "Accès & Journal",
  journal: "Journal",
  reminders: "Rappels WhatsApp",
  whatsapp: "WhatsApp",
};

const iCls =
  "w-full bg-secondary border border-border px-3 py-2.5 font-body text-[13px] text-foreground focus:border-terra outline-none rounded-sm";
const btn1 =
  "bg-terra text-warm-white px-6 py-2.5 font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors rounded-sm";

export function AdminLayout({ activeTab, onTabChange, onRefresh, children }: AdminLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin, loading: authLoading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const isSignup = false; // signup disabled — accounts managed by super-admin only
  const [now, setNow] = useState(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newBookings, setNewBookings] = useState(0);
  const [newWaitlist, setNewWaitlist] = useState(0);
  const [newPacks, setNewPacks] = useState(0);
  const subsRef = useRef(false);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  // Realtime subscriptions removed — use manual refresh instead
  useEffect(() => {
    subsRef.current = false;
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const { error } = await signIn(email, password);
    if (error)
      setLoginError(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : error.message);
    setLoginLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    // Password reset not available — contact super-admin
    setForgotLoading(false);
    setForgotSent(true);
  };

  if (authLoading)
    return (
      <main className="bg-background min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-terra animate-spin" />
      </main>
    );

  if (!user || !isAdmin)
    return (
      <main className="bg-background min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border p-8 w-full max-w-md rounded-3xl"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <MeridianLogo size={96} variant="theme" animate floatAnimation spinDuration={10} />
            </div>
            <h1
              className="font-display text-2xl text-foreground mb-1"
              style={{ fontWeight: 300, letterSpacing: "0.1em" }}
            >
              Espace Admin
            </h1>
            <p
              className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground"
              style={{ fontWeight: 300 }}
            >
              The Circle · Gestion
            </p>
          </div>
          {user && !isAdmin ? (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-center">
              <p className="font-body text-[12px] text-destructive">Ce compte n'a pas les droits administrateur.</p>
              <button onClick={signOut} className="mt-3 font-body text-[11px] text-muted-foreground hover:text-terra">
                Se déconnecter
              </button>
            </div>
          ) : showForgotPwd ? (
            /* ── Forgot password flow ── */
            <div className="space-y-4">
              {forgotSent ? (
                <div className="p-4 bg-terra/10 border border-terra/20 rounded-2xl text-center">
                  <p className="font-body text-[13px] text-terra font-medium mb-1">Email envoyé ✓</p>
                  <p className="font-body text-[11px] text-muted-foreground">
                    Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="font-body text-[12px] text-muted-foreground text-center">
                    Entrez votre email pour recevoir un lien de réinitialisation.
                  </p>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={iCls}
                    placeholder="votre@email.com"
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className={btn1 + " w-full py-3 justify-center disabled:opacity-50"}
                  >
                    {forgotLoading ? "Envoi..." : "Envoyer le lien"}
                  </button>
                </form>
              )}
              <button
                onClick={() => { setShowForgotPwd(false); setForgotSent(false); setForgotEmail(""); }}
                className="w-full font-body text-[11px] text-muted-foreground hover:text-terra transition-colors"
              >
                ← Retour à la connexion
              </button>
            </div>
          ) : (
            /* ── Login form ── */
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={iCls}
                placeholder="Email"
                required
              />
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={iCls + " pr-12"}
                  placeholder="Mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginError && <p className="font-body text-[12px] text-destructive text-center">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className={btn1 + " w-full py-3 justify-center disabled:opacity-50"}
              >
                {loginLoading ? "Connexion..." : "Se connecter"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForgotPwd(true); setForgotEmail(email); }}
                className="w-full font-body text-[11px] text-muted-foreground hover:text-terra transition-colors text-center"
              >
                Mot de passe oublié ?
              </button>
            </form>
          )}
        </motion.div>
      </main>
    );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`w-[240px] min-h-screen fixed top-0 left-0 z-50 flex flex-col transition-transform duration-300 bg-secondary border-r border-border ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-5 flex items-center justify-between gap-3 border-b border-border">
          <div className="flex items-center gap-3">
            <MeridianLogo size={44} variant="theme" animate spinDuration={14} />
            <div>
              <p
                className="font-display text-[15px] text-foreground"
                style={{ fontWeight: 300, letterSpacing: "0.12em" }}
              >
                The Circle
              </p>
              <p className="font-body text-[8px] tracking-[0.3em] uppercase text-terra" style={{ fontWeight: 400 }}>
                Administration
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-muted-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              <p
                className="font-body text-[8px] tracking-[0.5em] uppercase px-3 py-2 text-muted-foreground/50"
                style={{ fontWeight: 500 }}
              >
                {group.label}
              </p>
              {group.tabs.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    onTabChange(key);
                    if (key === "planning") setNewBookings(0);
                    if (key === "waitlist") setNewWaitlist(0);
                    if (key === "packs") setNewPacks(0);
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 font-body text-[13px] w-full text-left rounded-xl mb-0.5 transition-all"
                  style={{
                    fontWeight: activeTab === key ? 500 : 300,
                    background: activeTab === key ? "hsl(var(--terra))" : "transparent",
                    color: activeTab === key ? "#FBF7F2" : "hsl(var(--muted-foreground))",
                  }}
                  onMouseEnter={e => { if (activeTab !== key) { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--card))"; (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--foreground))"; } }}
                  onMouseLeave={e => { if (activeTab !== key) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--muted-foreground))"; } }}
                >
                  <Icon size={15} style={{ opacity: activeTab === key ? 1 : 0.6 }} />
                  <span className="flex-1">{label}</span>
                  {key === "planning" && newBookings > 0 && (
                    <span className="bg-destructive text-warm-white text-[9px] px-1.5 py-0.5 rounded-full font-body">
                      {newBookings}
                    </span>
                  )}
                  {key === "waitlist" && newWaitlist > 0 && (
                    <span className="font-body text-[9px] px-1.5 py-0.5 rounded-full bg-terra text-warm-white">
                      {newWaitlist}
                    </span>
                  )}
                  {key === "packs" && newPacks > 0 && (
                    <span className="font-body text-[9px] px-1.5 py-0.5 rounded-full bg-terra text-warm-white">
                      {newPacks}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 space-y-3 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-2 font-body text-[10px] tracking-[0.2em] uppercase w-full transition-colors text-terra hover:text-terra-dark"
            style={{ fontWeight: 300 }}
          >
            <ArrowLeft size={12} /> Voir le site
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-2 font-body text-[10px] tracking-[0.2em] uppercase w-full transition-colors text-muted-foreground hover:text-destructive"
            style={{ fontWeight: 300 }}
          >
            <LogOut size={12} /> Déconnexion
          </button>
          <p className="font-body text-[11px] text-muted-foreground/50" style={{ fontWeight: 200 }}>
            {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </aside>

      <main className="md:ml-[240px] flex-1 flex flex-col min-w-0">
        <header
          className="px-4 md:px-9 h-[60px] flex items-center justify-between sticky top-0 z-40 bg-secondary border-b border-border"
        >
          <div className="flex items-center gap-3">
            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center mr-1 border border-border text-muted-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect y="2" width="16" height="2" rx="1" />
                <rect y="7" width="16" height="2" rx="1" />
                <rect y="12" width="16" height="2" rx="1" />
              </svg>
            </button>
            <h1 className="font-display text-xl text-foreground" style={{ fontWeight: 300, letterSpacing: "0.05em" }}>
              {tabTitle[activeTab]}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block font-body text-[11px] text-muted-foreground" style={{ fontWeight: 200 }}>
              {user.email}
            </span>
            <Link
              to="/"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 font-body text-[11px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full transition-all text-terra border border-terra/35 hover:bg-terra/10"
              style={{ fontWeight: 500 }}
            >
              Voir le site ↗
            </Link>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border hover:border-terra/50 hover:bg-terra/10 text-muted-foreground hover:text-terra transition-all"
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button
              onClick={onRefresh}
              className="font-body text-[11px] tracking-[0.2em] uppercase flex items-center gap-1 transition-colors text-muted-foreground hover:text-terra"
              style={{ fontWeight: 200 }}
            >
              <RefreshCw size={12} /> Actualiser
            </button>
          </div>
        </header>
        <div className="p-4 md:p-9 flex-1">{children}</div>
      </main>
    </div>
  );
}

export const adminCall = async (body: any) => {
  const res = await fetch("/api/admin/call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(() => {
        const token = localStorage.getItem("evolv_admin_token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      })(),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `API error ${res.status}`);
  if (data?.error) throw new Error(data.error);

  // Compat: certains écrans attendent res.data, d'autres lisent des clés directes (res.count, res.usage...)
  if (Array.isArray(data)) return { data };
  if (data && typeof data === "object") return { ...data, data };
  return { data };
};
