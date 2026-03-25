/**
 * WaitlistForm — s'intègre dans PlanningPage quand une session est complète.
 * Peut aussi être utilisé standalone avec session=null (intérêt général).
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, Mail, Phone, User, Clock } from "lucide-react";
import { api } from "@/lib/api";
import MeridianLogo from "@/components/brand/MeridianLogo";

interface SessionInfo {
  title: string;
  date: string;
  time: string;
  instructor: string;
}

interface WaitlistFormProps {
  session?: SessionInfo | null;
  onClose?: () => void;
  onSuccess?: () => void;
  compact?: boolean; // true = inline small version
}

export default function WaitlistForm({ session, onClose, onSuccess, compact = false }: WaitlistFormProps) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  const dayLabel = session
    ? new Date(session.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : "—";

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) { setError("Nom et email requis"); return; }
    setLoading(true); setError("");
    try {
      await api.waitlist.join({
        client_name:  name.trim(),
        client_email: email.trim().toLowerCase(),
        client_phone: phone.trim() || null,
        class_name:   session?.title    ?? "Intérêt général",
        class_day:    session ? dayLabel : "—",
        class_time:   session?.time      ?? "—",
        coach:        session?.instructor ?? "—",
        status:       "pending",
      });
      setDone(true);
      setTimeout(() => { onSuccess?.(); }, 2800);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-background border border-border/60 rounded-xl px-4 py-3 font-body text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:border-terra focus:outline-none transition-colors";

  if (done) return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center gap-4 text-center ${compact ? "py-8" : "py-16"}`}
    >
      <div className="relative">
        <MeridianLogo size={compact ? 56 : 80} variant="sand" animate floatAnimation spinDuration={8} />
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
          className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#4E9E7A] rounded-full flex items-center justify-center"
        >
          <Check size={14} className="text-white" />
        </motion.div>
      </div>
      <div>
        <p className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>
          Vous êtes sur la liste !
        </p>
        <p className="font-body text-[12px] text-muted-foreground mt-1" style={{ fontWeight: 300 }}>
          Nous vous contacterons dès qu'une place se libère.
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>

      {/* Header */}
      {!compact && (
        <div className="flex flex-col items-center gap-3 text-center pb-2">
          <MeridianLogo size={64} variant="sand" animate floatAnimation spinDuration={10} />
          <div>
            <p className="font-display text-2xl text-foreground" style={{ fontWeight: 300 }}>
              Liste d'attente
            </p>
            <p className="font-body text-[11px] tracking-[0.3em] uppercase text-muted-foreground mt-1" style={{ fontWeight: 400 }}>
              EVØLV Studio
            </p>
          </div>
        </div>
      )}

      {/* Session info badge */}
      {session && (
        <div className="bg-terra/8 border border-foreground/15 rounded-2xl p-4 flex items-start gap-3">
          <Bell size={16} className="text-terra mt-0.5 shrink-0" />
          <div>
            <p className="font-body text-[13px] text-foreground font-medium">{session.title}</p>
            <p className="font-body text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock size={10} /> {dayLabel} · {session.time} · {session.instructor}
            </p>
          </div>
        </div>
      )}

      {!session && (
        <div className="bg-terra/8 border border-foreground/15 rounded-2xl p-4">
          <p className="font-body text-[13px] text-foreground font-medium">Intérêt général</p>
          <p className="font-body text-[11px] text-muted-foreground mt-0.5">
            Laissez vos coordonnées et nous vous contacterons pour votre première séance.
          </p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-3">
        <div className="relative">
          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputCls + " pl-10"}
            placeholder="Votre prénom & nom *"
          />
        </div>
        <div className="relative">
          <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputCls + " pl-10"}
            placeholder="Email *"
          />
        </div>
        <div className="relative">
          <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className={inputCls + " pl-10"}
            placeholder="+212 6XX XXX XXX (recommandé)"
          />
        </div>
      </div>

      {error && (
        <p className="font-body text-[12px] text-destructive text-center">{error}</p>
      )}

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-terra text-warm-white py-3.5 rounded-full font-body text-[12px] tracking-[0.25em] uppercase hover:bg-foreground/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ fontFamily: "'DM Sans', Inter, sans-serif", fontWeight: 600 }}
      >
        {loading ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Bell size={15} />
          </motion.div>
        ) : (
          <><Bell size={15} /> M'inscrire sur la liste</>
        )}
      </button>

      <p className="font-body text-[10px] text-muted-foreground/50 text-center" style={{ fontWeight: 300 }}>
        Nous ne partageons jamais vos données. Contact uniquement pour disponibilités.
      </p>
    </div>
  );
}
