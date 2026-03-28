import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Dumbbell, ArrowRight, AlertCircle, Users, Clock, Bell, CreditCard, Ticket, X, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { SessionData } from "@/hooks/useSessions";
import { STRIPE_PRICES, isReformer } from "@/lib/schedule";
import { generateWhatsAppUrl, buildBookingConfirmationMessage } from "@/lib/whatsapp";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import WeekPlanning from "@/components/WeekPlanning";
import VertebraLogo from "@/components/brand/VertebraLogo";


const PlanningPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [wantsDrink, setWantsDrink] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState("");
  const [wantsMat, setWantsMat] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payOnSite, setPayOnSite] = useState(false);
  const [equipmentChoice, setEquipmentChoice] = useState<"reformer" | "springwall" | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [usePackCode, setUsePackCode] = useState(false);
  const [packCode, setPackCode] = useState("");
  const [packValidating, setPackValidating] = useState(false);
  const [packError, setPackError] = useState("");
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);
  const [drinksList, setDrinksList] = useState<string[]>([]);
  const [alternativeSessions, setAlternativeSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    api.drinks.list().then((data) => setDrinksList((data || []).map((d: any) => d.name))).catch(() => {});
  }, []);

  // Auto-open booking from ?session=ID URL param
  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (!sessionId) return;
    api.sessions.get(sessionId).then((data) => {
      if (data) handleSelectSession({ ...data, enrolled: data.enrolled ?? 0 } as SessionData);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetBooking = () => {
    setSelectedSession(null);
    setWantsDrink(false);
    setSelectedDrink("");
    setWantsMat(false);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setPayOnSite(false);
    setEquipmentChoice(null);
    setShowWaitlist(false);
    setWaitlistSuccess(false);
    setUsePackCode(false);
    setPackCode("");
    setPackError("");
    setShowEquipmentPicker(false);
    setShowOptionsModal(false);
    setShowPaymentModal(false);
    setAlternativeSessions([]);
  };


  const fetchNearestSessions = useCallback(async (session: SessionData) => {
    const sessionDate = new Date(`${session.date}T${session.time}`);
    const start = new Date(sessionDate);
    start.setDate(start.getDate() - 3);
    const end = new Date(sessionDate);
    end.setDate(end.getDate() + 3);

    const data = await api.sessions.list({ activeOnly: true }).catch(() => [] as any[]);

    const alternatives = (data || [])
      .map((s: any) => ({ ...s, enrolled: s.enrolled ?? 0 }))
      .filter((s: SessionData) => {
        if (s.id === session.id) return false;
        if (s.type !== session.type) return false;
        if (s.capacity - s.enrolled <= 0) return false;
        const d = s.date;
        return d >= start.toISOString().slice(0, 10) && d <= end.toISOString().slice(0, 10);
      })
      .sort((a: SessionData, b: SessionData) => {
        const da = Math.abs(new Date(`${a.date}T${a.time}`).getTime() - sessionDate.getTime());
        const db = Math.abs(new Date(`${b.date}T${b.time}`).getTime() - sessionDate.getTime());
        return da - db;
      })
      .slice(0, 3);

    setAlternativeSessions(alternatives);
  }, []);

  const handleSelectSession = (session: SessionData) => {
    resetBooking();
    const full = session.capacity - session.enrolled <= 0;
    setSelectedSession(session);
    if (full) {
      setShowWaitlist(true);
      fetchNearestSessions(session);
    }
    else if (isReformer(session.title)) setShowEquipmentPicker(true);
    else setShowOptionsModal(true);
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const formatDay = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });

  const handleJoinWaitlist = async () => {
    if (!selectedSession || !name || !email) return;
    if (!isValidEmail(email)) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }
    setLoading(true);
    try {
      await api.waitlist.join({
        client_name: name,
        client_email: email,
        client_phone: phone || null,
        class_day: formatDay(selectedSession.date),
        class_time: selectedSession.time,
        class_name: selectedSession.title,
        coach: selectedSession.instructor,
      });
      if (error) throw error;
      setWaitlistSuccess(true);
    } catch {
      alert("Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSession || !name || !email) return;
    if (!isValidEmail(email)) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }
    setLoading(true);
    try {
      const bookingNotes = [
        notes,
        equipmentChoice ? `Équipement: ${equipmentChoice}` : "",
        payOnSite ? "💳 Paiement sur place" : "",
        usePackCode && packCode ? `Pack: ${packCode}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      let packResult: { creditsRemaining?: number; creditsTotal?: number } = {};
      if (usePackCode && packCode) {
        setPackValidating(true);
        setPackError("");
        try {
          const packData = await api.packs.useCredit({
            packCode,
            clientEmail: email,
            session_id: selectedSession.id,
            session_title: selectedSession.title,
            session_date: selectedSession.date,
            session_time: selectedSession.time,
            client_name: name,
            client_phone: phone || null,
          });
          packResult = { creditsRemaining: packData.creditsRemaining, creditsTotal: packData.creditsTotal };
        } catch (packErr: any) {
          setPackError(packErr?.message || "Erreur de validation du pack.");
          setPackValidating(false);
          setLoading(false);
          return;
        }
        setPackValidating(false);
      }
      const dayLabel = formatDay(selectedSession.date);
      // Register participant via API
      await api.sessions.registerParticipant(selectedSession.id, {
        client_name: name,
        client_email: email,
        client_phone: phone || null,
        class_day: dayLabel,
        class_time: selectedSession.time,
        class_name: selectedSession.title,
        coach: selectedSession.instructor,
        wants_drink: wantsDrink,
        drink_type: wantsDrink ? selectedDrink : null,
        wants_mat: wantsMat,
        notes: bookingNotes || null,
        payment_status: usePackCode ? "pack" : payOnSite ? "pay_on_site" : "pending",
        pack_id: usePackCode ? packCode : null,
      });
      const whatsappMsg = buildBookingConfirmationMessage({
        name,
        day: dayLabel,
        time: selectedSession.time,
        className: selectedSession.title,
        coach: selectedSession.instructor,
        packCode: usePackCode ? packCode : undefined,
        creditsRemaining: packResult.creditsRemaining,
        creditsTotal: packResult.creditsTotal,
        paymentMethod: usePackCode ? "pack" : payOnSite ? "on_site" : "online",
      });
      // Email confirmation removed — no email service yet
      console.log("Booking confirmed for:", email, selectedSession.title);

      if (usePackCode || payOnSite) {
        window.open(generateWhatsAppUrl(whatsappMsg), "_blank");
        window.location.href = `/payment-success?method=${usePackCode ? "pack" : "on_site"}`;
        return;
      }
      const data = await api.payment.createSession({
        priceId: STRIPE_PRICES.SINGLE_SESSION,
        mode: "payment",
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        bookingData: {
          day: dayLabel,
          time: selectedSession.time,
          class: selectedSession.title,
          coach: selectedSession.instructor,
          drink: wantsDrink ? selectedDrink : null,
          mat: wantsMat,
          equipment: equipmentChoice,
        },
      });
      if (data?.url) window.location.href = data.url;
    } catch {
      alert("Erreur lors de la réservation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-card border border-border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-terra transition-colors";

  return (
    <main className="bg-background min-h-screen">

      <Navbar onBookClick={() => {}} />
      <section className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="border border-border bg-card p-6 md:p-10 mb-8"
          >
            <div className="text-center">
              <p className="brand-label justify-center mb-6">Planning EVØLV</p>
              <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4" style={{ fontWeight: 400, letterSpacing: "0.02em" }}>
                Réservez votre <em className="italic" style={{ fontWeight: 300 }}>prochaine séance</em>
              </h1>
              <p className="font-body text-muted-foreground mb-8 max-w-lg mx-auto" style={{ fontWeight: 300, fontSize: "14px" }}>
                Choisissez votre créneau en 30 secondes. Places limitées — petits groupes, suivi personnalisé.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border text-left">
                {[
                  { icon: Clock, title: "Réservation immédiate", desc: "Paiement en ligne, pack ou sur place." },
                  { icon: ShieldCheck, title: "Politique claire", desc: "Annulation gratuite jusqu'à 2h avant." },
                  { icon: Zap, title: "Petits groupes", desc: "6 personnes max — suivi individualisé." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-5 border-r border-border last:border-r-0">
                    <Icon size={15} className="text-terra mb-3" />
                    <p className="font-body text-foreground text-[13px] mb-1" style={{ fontWeight: 500 }}>{title}</p>
                    <p className="font-body text-muted-foreground text-[12px]" style={{ fontWeight: 300 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="bg-terra text-white p-4 md:p-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <p className="font-body text-[10px] tracking-[0.2em] uppercase opacity-80 mb-1" style={{ fontWeight: 500 }}>Offre découverte</p>
              <p className="font-body text-sm" style={{ fontWeight: 300 }}>Nouveau chez EVØLV ? Réservez votre créneau puis demandez votre offre d'essai sur WhatsApp.</p>
            </div>
            <a href="https://wa.me/33668710966" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-terra px-5 py-2.5 font-body text-[11px] tracking-[0.2em] uppercase hover:opacity-90 transition-opacity shrink-0" style={{ fontWeight: 600 }}>
              Demander l'offre <ArrowRight size={13} />
            </a>
          </div>

          <WeekPlanning onSessionSelect={handleSelectSession} />
        </div>
      </section>
      <Footer />
      <WhatsAppButton />

      {/* Equipment picker modal */}
      <AnimatePresence>
        {showEquipmentPicker && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            onClick={resetBooking}
          >
            <motion.div
              initial={{ y: 30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.95 }}
              className="bg-card w-full max-w-sm shadow-2xl overflow-hidden border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <div>
                  <p className="font-display text-lg text-foreground" style={{ fontWeight: 400 }}>
                    Choisir l'équipement
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {selectedSession.title} · {selectedSession.time}
                  </p>
                </div>
                <button
                  onClick={resetBooking}
                  className="w-8 h-8 border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-3">
                {(["reformer", "springwall"] as const).map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setEquipmentChoice(eq)}
                    className={`w-full p-4 rounded-2xl border text-center transition-all ${equipmentChoice === eq ? "border-terra bg-secondary/20 shadow-sm" : "border-border bg-card hover:border-foreground/20"}`}
                  >
                    <p className="font-body text-sm text-foreground">
                      {eq === "reformer" ? "Reformer classique" : "Springwall"}
                    </p>
                  </button>
                ))}
              </div>
              <div className="px-6 pb-6">
                <button
                  disabled={!equipmentChoice}
                  onClick={() => {
                    setShowEquipmentPicker(false);
                    setShowOptionsModal(true);
                  }}
                  className="w-full bg-terra text-white py-3.5 font-body text-xs tracking-widest uppercase disabled:opacity-40 hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waitlist modal */}
      <AnimatePresence>
        {showWaitlist && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            onClick={resetBooking}
          >
            <motion.div
              initial={{ y: 30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.95 }}
              className="bg-card w-full max-w-sm shadow-2xl overflow-hidden border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <p className="font-display text-lg text-foreground" style={{ fontWeight: 400 }}>
                  Ce cours est complet
                </p>
                <button
                  onClick={resetBooking}
                  className="w-8 h-8 border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                {waitlistSuccess ? (
                  <div className="text-center py-4">
                    <Bell size={32} className="text-terra mx-auto mb-3" />
                    <h3 className="font-display text-xl text-foreground mb-2" style={{ fontWeight: 400 }}>
                      Inscription confirmée !
                    </h3>
                    <p className="font-body text-sm text-muted-foreground">
                      Vous serez contacté(e) si une place se libère.
                    </p>
                    <button onClick={resetBooking} className="mt-4 font-body text-xs text-muted-foreground underline">
                      Fermer
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-body text-sm text-muted-foreground mb-4">Inscrivez-vous à la liste d'attente ou choisissez une session proche disponible.</p>
                    {alternativeSessions.length > 0 && (
                      <div className="mb-4 border border-border bg-secondary/40 p-3 space-y-2">
                        <p className="font-body text-[11px] uppercase tracking-widest text-terra">Sessions les plus proches</p>
                        {alternativeSessions.map((alt) => (
                          <button
                            key={alt.id}
                            type="button"
                            onClick={() => {
                              setShowWaitlist(false);
                              handleSelectSession(alt);
                            }}
                            className="w-full text-left border border-border bg-card px-3 py-2 hover:border-foreground/30 transition-colors"
                          >
                            <p className="font-body text-[12px] text-foreground font-medium">{alt.title} · {alt.time}</p>
                            <p className="font-body text-[10px] text-muted-foreground">{formatDay(alt.date)} · {alt.instructor}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="space-y-3 mb-4">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputCls}
                        placeholder="Votre nom *"
                      />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        className={inputCls}
                        placeholder="votre@email.com *"
                      />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        className={inputCls}
                        placeholder="+212 6XX XXX XXX"
                      />
                    </div>
                    <button
                      disabled={!name || !email || !isValidEmail(email) || loading}
                      onClick={handleJoinWaitlist}
                      className="w-full bg-terra text-white py-3 font-body text-xs tracking-widest uppercase disabled:opacity-40 hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2"
                      style={{ fontWeight: 600 }}
                    >
                      {loading ? (
                        "Inscription..."
                      ) : (
                        <>
                          <Bell size={16} /> Rejoindre la liste d'attente
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options modal */}
      <AnimatePresence>
        {showOptionsModal && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            onClick={() => setShowOptionsModal(false)}
          >
            <motion.div
              initial={{ y: 30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.95 }}
              className="bg-card w-full max-w-md shadow-2xl overflow-hidden border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <div>
                  <p className="font-display text-lg text-foreground" style={{ fontWeight: 400 }}>
                    Personnaliser
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {selectedSession.title} · {selectedSession.time}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOptionsModal(false);
                    resetBooking();
                  }}
                  className="w-8 h-8 border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => setWantsDrink(!wantsDrink)}
                  className={`w-full flex items-center gap-3 p-4 border transition-all ${wantsDrink ? "border-terra bg-secondary/20" : "border-border bg-card hover:border-foreground/20"}`}
                >
                  <div className="w-9 h-9 bg-secondary/50 flex items-center justify-center shrink-0">
                    <Coffee size={18} className="text-terra" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-body text-sm text-foreground font-medium">Commander une boisson</p>
                    <p className="font-body text-[11px] text-muted-foreground">Prête à votre arrivée</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all ${wantsDrink ? "bg-terra border-terra" : "border-border"}`}
                  />
                </button>
                {wantsDrink && (
                  <div className="flex flex-wrap gap-2 pl-2">
                    {(drinksList.length > 0
                      ? drinksList
                      : ["Eau citronnée", "Thé vert matcha", "Smoothie protéiné", "Jus détox"]
                    ).map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDrink(d)}
                        className={`px-3 py-1.5 font-body text-xs transition-all border ${selectedDrink === d ? "bg-terra text-white border-terra" : "bg-secondary border-border text-muted-foreground"}`}
                        style={{ fontWeight: 500 }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setWantsMat(!wantsMat)}
                  className={`w-full flex items-center gap-3 p-4 border transition-all ${wantsMat ? "border-terra bg-secondary/20" : "border-border bg-card hover:border-foreground/20"}`}
                >
                  <div className="w-9 h-9 bg-secondary/50 flex items-center justify-center shrink-0">
                    <Dumbbell size={18} className="text-terra" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-body text-sm text-foreground font-medium">Réserver un tapis</p>
                    <p className="font-body text-[11px] text-muted-foreground">Tapis personnel réservé</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all ${wantsMat ? "bg-terra border-terra" : "border-border"}`}
                  />
                </button>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={() => {
                    setShowOptionsModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="w-full bg-terra text-white py-3.5 font-body text-xs tracking-widest uppercase hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment modal */}
      <AnimatePresence>
        {showPaymentModal && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ y: 30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.95 }}
              className="bg-card w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
                <div>
                  <p className="font-display text-lg text-foreground" style={{ fontWeight: 400 }}>
                    Vos informations
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {selectedSession.title} · {selectedSession.time}
                    {wantsDrink && selectedDrink ? ` · ☕ ${selectedDrink}` : ""}
                    {wantsMat ? " · 🧘 Tapis" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="font-body text-sm text-foreground block mb-1.5 font-medium">Nom complet *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="font-body text-sm text-foreground block mb-1.5 font-medium">Email *</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className={inputCls}
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label className="font-body text-sm text-foreground block mb-1.5 font-medium">Téléphone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    className={inputCls}
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="font-body text-sm text-foreground block mb-1.5 font-medium">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${inputCls} min-h-[70px] resize-none`}
                    placeholder="Blessures, préférences..."
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-body text-sm text-foreground font-medium">Mode de paiement</p>
                  <button
                    onClick={() => {
                      setPayOnSite(false);
                      setUsePackCode(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 border transition-all ${!payOnSite && !usePackCode ? "border-terra bg-secondary/20" : "border-border bg-card"}`}
                  >
                    <CreditCard size={16} className="text-terra" />
                    <span className="font-body text-sm text-foreground">Payer en ligne (Stripe)</span>
                  </button>
                  <button
                    onClick={() => {
                      setPayOnSite(true);
                      setUsePackCode(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 border transition-all ${payOnSite ? "border-terra bg-secondary/20" : "border-border bg-card"}`}
                  >
                    <Clock size={16} className="text-terra" />
                    <span className="font-body text-sm text-foreground">Payer sur place</span>
                  </button>
                  <button
                    onClick={() => {
                      setUsePackCode(true);
                      setPayOnSite(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 border transition-all ${usePackCode ? "border-terra bg-secondary/20" : "border-border bg-card"}`}
                  >
                    <Ticket size={16} className="text-terra" />
                    <span className="font-body text-sm text-foreground">J'ai un code pack</span>
                  </button>
                </div>
                {usePackCode && (
                  <div className="space-y-2">
                    <input
                      value={packCode}
                      onChange={(e) => setPackCode(e.target.value.toUpperCase())}
                      maxLength={12}
                      className={inputCls}
                      placeholder="TC-XXXX-XXXX"
                    />
                    {packError && <p className="font-body text-xs text-destructive font-medium">{packError}</p>}
                  </div>
                )}
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowOptionsModal(true);
                  }}
                  className="flex-1 border border-border text-foreground py-3.5 font-body text-xs tracking-widest uppercase hover:bg-card transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Retour
                </button>
                <button
                  disabled={!name || !email || !isValidEmail(email) || loading || (usePackCode && !packCode)}
                  onClick={handleSubmit}
                  className="flex-1 bg-terra text-white py-3.5 font-body text-xs tracking-widest uppercase disabled:opacity-40 hover:bg-foreground/80 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  {loading || packValidating
                    ? "Traitement..."
                    : usePackCode
                      ? "Utiliser mon code"
                      : payOnSite
                        ? "Confirmer"
                        : `Payer ${selectedSession?.price || 0} DH`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default PlanningPage;
