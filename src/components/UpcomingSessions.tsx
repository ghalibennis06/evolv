// src/components/UpcomingSessions.tsx
// FIX BUG 6 — Bouton Réserver pré-sélectionne la session (?session=id)
// FIX BUG 7 — Lien liste d'attente utilise le vrai numéro WhatsApp
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Filter } from "lucide-react";
import { useSessions } from "@/hooks/useSessions";
import { useNextSession } from "@/hooks/useNextSession";
import { generateWhatsAppUrl, buildWaitlistMessage } from "@/lib/whatsapp";

interface Props {
  limit?: number | null;
  showFilters?: boolean;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

// FIX BUG 11 — Affichage intelligent Reformer/Springwall
const isReformerType = (type: string) => type.toLowerCase().includes("reformer");

function getSlotDisplay(session: { type: string; capacity: number; enrolled: number }) {
  const spotsLeft = Math.max(0, session.capacity - session.enrolled);

  if (!isReformerType(session.type)) {
    if (spotsLeft === 0) return { text: "Complet", color: "text-destructive", isFull: true };
    return { text: `${session.enrolled}/${session.capacity}`, color: "text-muted-foreground", isFull: false };
  }

  // Logique Reformer : 4 classique + 2 Springwall
  const REFORMER_SLOTS = 4;
  const SPRINGWALL_SLOTS = 2;
  const reformerTaken = Math.min(session.enrolled, REFORMER_SLOTS);
  const springwallTaken = Math.max(0, session.enrolled - REFORMER_SLOTS);
  const reformerLeft = REFORMER_SLOTS - reformerTaken;
  const springwallLeft = SPRINGWALL_SLOTS - springwallTaken;

  if (spotsLeft === 0) return { text: "Complet", color: "text-destructive", isFull: true };

  if (reformerLeft > 0) {
    return {
      text: `${reformerLeft} Reformer · ${springwallLeft} Springwall`,
      color: "text-muted-foreground",
      isFull: false,
    };
  }
  return {
    text: `Reformer complet · ${springwallLeft} Springwall dispo`,
    color: "text-warning",
    isFull: false,
  };
}

const UpcomingSessions = ({ limit = null, showFilters = false }: Props) => {
  const { sessions, loading } = useSessions({ fromToday: true, limit: limit ?? undefined });
  const nextSession = useNextSession(sessions);
  const [filterType, setFilterType] = useState<string | null>(null);

  const types = [...new Set(sessions.map((s) => s.type))];
  const filtered = sessions.filter((s) => !filterType || s.type === filterType);

  const grouped = filtered.reduce<Record<string, typeof sessions>>((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {});

  if (loading) return <p className="text-center font-body text-muted-foreground py-20">Chargement du planning...</p>;

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-muted-foreground">Aucune séance disponible pour le moment.</p>
        <p className="font-body text-[12px] text-muted-foreground/60 mt-2">
          Les prochaines séances seront bientôt publiées.
        </p>
      </div>
    );
  }

  return (
    <div>
      {showFilters && types.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-10 justify-center">
          <Filter size={14} className="text-muted-foreground" />
          <button
            onClick={() => setFilterType(null)}
            className={`px-4 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase transition-all ${
              !filterType
                ? "bg-terra text-warm-white"
                : "border border-border text-muted-foreground hover:border-terra/30"
            }`}
            style={{ fontWeight: 500 }}
          >
            Tous
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(filterType === t ? null : t)}
              className={`px-4 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase transition-all ${
                filterType === t
                  ? "bg-terra text-warm-white"
                  : "border border-border text-muted-foreground hover:border-terra/30"
              }`}
              style={{ fontWeight: 500 }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(grouped).map(([date, daySessions]) => (
          <div key={date}>
            <p className="font-display text-lg text-foreground mb-3 capitalize" style={{ fontWeight: 400 }}>
              {formatDate(date)}
            </p>
            <div className="space-y-2">
              {daySessions.map((session) => {
                const isNext = nextSession?.id === session.id;
                const slot = getSlotDisplay(session);

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={`bg-card border p-5 transition-all relative rounded-2xl ${
                      isNext ? "border-success" : "border-border hover:border-terra/30"
                    }`}
                    style={{
                      animation: isNext ? "next-pulse 3s ease-in-out infinite" : undefined,
                      background: isNext
                        ? "linear-gradient(135deg, hsl(var(--card)), hsl(var(--success) / 0.05))"
                        : undefined,
                    }}
                  >
                    {isNext && (
                      <span
                        className="absolute -top-px right-4 font-body text-[8px] tracking-[0.35em] uppercase text-warm-white px-3 py-1 rounded-b-lg"
                        style={{ fontWeight: 500, background: "hsl(var(--success))" }}
                      >
                        Prochaine
                      </span>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-full bg-terra/10 flex items-center justify-center">
                          <span className="font-body text-sm text-terra font-semibold">{session.time}</span>
                        </div>
                        <div>
                          <h3 className="font-display text-[16px] text-foreground" style={{ fontWeight: 400 }}>
                            {session.title}
                          </h3>
                          <p className="font-body text-[11px] text-muted-foreground">
                            {session.instructor} · {session.duration}min · {session.level}
                          </p>
                          {/* FIX BUG 11 — Affichage places Reformer/Springwall */}
                          <p className={`font-body text-[11px] flex items-center gap-1 mt-0.5 ${slot.color}`}>
                            <Users size={11} />
                            {slot.text}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {slot.isFull ? (
                          // FIX BUG 7 — Utiliser generateWhatsAppUrl au lieu du numéro hardcodé
                          <a
                            href={generateWhatsAppUrl(
                              buildWaitlistMessage({
                                name: "",
                                className: session.title,
                                day: formatDate(session.date),
                                time: session.time,
                              }).replace("👤 \n", ""),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-accent text-accent px-4 py-2 rounded-full font-body text-[10px] tracking-widest uppercase hover:bg-accent hover:text-warm-white transition-all"
                            style={{ fontWeight: 500 }}
                          >
                            Liste d&apos;attente
                          </a>
                        ) : (
                          // FIX BUG 6 — Passer l'ID de session dans l'URL
                          <a
                            href={`/planning?session=${session.id}`}
                            className="border border-terra text-terra px-4 py-2 rounded-full font-body text-[10px] tracking-widest uppercase hover:bg-terra hover:text-warm-white transition-all"
                            style={{ fontWeight: 500 }}
                          >
                            Réserver
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingSessions;
