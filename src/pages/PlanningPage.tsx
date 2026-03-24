import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Dumbbell, ArrowRight, AlertCircle, Users, Clock, Bell, CreditCard, Ticket, X, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SessionData } from "@/hooks/useSessions";
import { STRIPE_PRICES, isReformer } from "@/lib/schedule";
import { generateWhatsAppUrl, buildBookingConfirmationMessage } from "@/lib/whatsapp";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import WeekPlanning from "@/components/WeekPlanning";
import MeridianLogo from "@/components/brand/MeridianLogo";
import PageBackgroundMeridian from "@/components/brand/PageBackgroundMeridian";

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
    supabase
      .from("admin_drinks")
      .select("name")
      .eq("is_available", true)
      .order("sort_order")
      .then(({ data }) => setDrinksList((data || []).map((d: any) => d.name)));
  }, []);

  // Auto-open booking from ?session=ID URL param
  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (!sessionId) return;
    supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()
      .then(({ data }) => {
        if (data) handleSelectSession({ ...data, enrolled: 0 } as SessionData);
      });
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

    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("is_active", true)
      .eq("type", session.type)
      .gte("date", start.toISOString().slice(0, 10))
      .lte("date", end.toISOString().slice(0, 10))
      .order("date")
      .order("time");

    const alternatives = (data || [])
      .map((s: any) => ({ ...s, enrolled: s.enrolled ?? 0 }))
      .filter((s: SessionData) => s.id !== session.id && s.capacity - s.enrolled > 0)
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
      const { error } = await supabase.from("waitlist").insert({
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
        const { data: packData, error: packErr } = await supabase.functions.invoke("use-pack-credit", {
          body: {
            packCode,
            clientEmail: email,
            session_id: selectedSession.id,
            session_title: selectedSession.title,
            session_date: selectedSession.date,
            session_time: selectedSession.time,
            client_name: name,
            client_phone: phone || null,
          },
        });
        if (packErr || packData?.error) {
          setPackError(packData?.error || "Erreur de validation du pack.");
          setPackValidating(false);
          setLoading(false);
          return;
        }
        packResult = { creditsRemaining: packData.creditsRemaining, creditsTotal: packData.creditsTotal };
        setPackValidating(false);
      }
      const dayLabel = formatDay(selectedSession.date);
      const { error } = await supabase.from("bookings").insert({
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
        status: "booked",
        payment_status: usePackCode ? "pack" : payOnSite ? "pay_on_site" : "pending",
        pack_id: usePackCode ? packCode : null,
      });
      if (error) throw error;
      await supabase.from("session_participants").insert({
        session_id: selectedSession.id,
        first_name: name.split(" ")[0],
        last_name: name.split(" ").slice(1).join(" ") || "",
        email,
        phone: phone || null,
        payment_status: usePackCode ? "Payé" : "En attente",
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
      // Email de confirmation via Resend (fire-and-forget)
      supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: `✅ Réservation confirmée — ${selectedSession.title}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FAF6F1;border-radius:16px">
              <h1 style="font-size:22px;font-weight:300;letter-spacing:0.08em;color:#1A1714;margin:0 0 8px">EVØLV</h1>
              <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#B8634A;margin:0 0 28px">Confirmation de réservation</p>
              <p style="color:#3D3530;font-size:15px;margin:0 0 20px">Bonjour <strong>${name}</strong>,</p>
              <div style="background:#fff;border:1px solid #E8E0D8;border-radius:12px;padding:20px;margin:0 0 20px">
                <p style="margin:0 0 8px;font-size:14px;color:#3D3530">📅 <strong>${dayLabel}</strong> à <strong>${selectedSession.time}</strong></p>
                <p style="margin:0 0 8px;font-size:14px;color:#3D3530">🏋️ <strong>${selectedSession.title}</strong> avec ${selectedSession.instructor}</p>
                ${wantsDrink && selectedDrink ? `<p style="margin:0 0 8px;font-size:14px;color:#3D3530">☕ Boisson : ${selectedDrink}</p>` : ""}
                ${usePackCode ? `<p style="margin:0;font-size:14px;color:#B8634A">🎫 Pack : <strong>${packCode}</strong> · ${packResult.creditsRemaining}/${packResult.creditsTotal} crédits restants</p>` : ""}
              </div>
              <p style="font-size:12px;color:#6B605A;line-height:1.6;margin:0 0 24px">📌 Annulation gratuite jusqu'à 2h avant le cours.</p>
              <a href="https://thecirclestudio.vercel.app/planning" style="display:inline-block;background:#B8634A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">Voir le planning</a>
            </div>`,
        },
      }).catch(() => {}); // silent fail — ne bloque pas la réservation

      if (usePackCode || payOnSite) {
        window.open(generateWhatsAppUrl(whatsappMsg), "_blank");
        window.location.href = `/payment-success?method=${usePackCode ? "pack" : "on_site"}`;
        return;
      }
      const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
        body: {
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
        },
      });
      if (fnError) throw fnError;
      if (data?.url) window.location.href = data.url;
    } catch {
      alert("Erreur lors de la réservation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-card border border-border px-4 py-3 rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-terra transition-colors";

  return (
    <main className="bg-background min-h-screen">
      <PageBackgroundMeridian />
      <Navbar onBookClick={() => {}} />
      <section className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden border border-border bg-card/80 backdrop-blur-sm rounded-3xl p-6 md:p-10 mb-10"
          >
            <div className="absolute -top-16 -right-12 w-52 h-52 rounded-full bg-secondary/40 blur-3xl" />
            <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-secondary/40 blur-2xl" />

            <div className="relative z-10 text-center">
              <div className="flex justify-center mb-5">
                <MeridianLogo size={48} variant="theme" animate floatAnimation spinDuration={13} />
              </div>

              <p className="inline-flex items-center gap-2 font-body text-[10px] tracking-[0.3em] uppercase text-terra mb-4 px-3 py-1 rounded-full border border-foreground/20 bg-secondary/20" style={{ fontWeight: 400 }}>
                <Sparkles size={12} /> Places limitées chaque semaine
              </p>

              <h1 className="font-display text-4xl md:text-6xl text-foreground" style={{ fontWeight: 400, letterSpacing: "0.1em" }}>
                Réservez votre <em className="italic text-terra">prochaine séance</em>
              </h1>

              <p className="font-body text-sm md:text-base text-muted-foreground mt-4 max-w-2xl mx-auto" style={{ fontWeight: 400 }}>
                Choisissez votre créneau en 30 secondes. Plus vous réservez tôt, plus vous gardez les meilleurs horaires.
              </p>

              <p className="font-body text-xs md:text-sm text-muted-foreground/90 mt-3 max-w-3xl mx-auto">
                Planning Pilates, Reformer et Yoga à Casablanca: vue Today pour réserver rapidement les places du jour, et vue Semaine pour organiser
                votre routine complète.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-7 text-left">
                {[
                  { icon: Clock, title: "Réservation immédiate", desc: "Validation rapide avec paiement en ligne, pack ou sur place." },
                  { icon: ShieldCheck, title: "Politique claire", desc: "Annulation gratuite jusqu'à 2h avant le cours." },
                  { icon: Zap, title: "Capacité boutique", desc: "Petits groupes pour un suivi personnalisé." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="bg-secondary/70 border border-border rounded-2xl p-4">
                    <Icon size={16} className="text-terra mb-2" />
                    <p className="font-body text-sm text-foreground" style={{ fontWeight: 500 }}>{title}</p>
                    <p className="font-body text-xs text-muted-foreground mt-1" style={{ fontWeight: 400 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="bg-terra text-warm-white rounded-2xl p-4 md:p-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <p className="font-body text-[10px] tracking-[0.2em] uppercase opacity-90" style={{ fontWeight: 500 }}>Offre découverte</p>
              <p className="font-body text-sm md:text-base" style={{ fontWeight: 400 }}>Nouveau chez EVØLV ? Réservez d'abord votre créneau, puis demandez votre offre d'essai sur WhatsApp.</p>
            </div>
            <a href="https://wa.me/33668710966" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-warm-white text-terra px-4 py-2 rounded-full font-body text-[11px] tracking-[0.2em] uppercase hover:opacity-90 transition-opacity" style={{ fontWeight: 600 }}>
              Demander l'offre <ArrowRight size={14} />
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
              className="bg-card w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
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
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
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
                  className="w-full bg-terra text-warm-white py-3.5 rounded-full font-body text-xs tracking-widest uppercase disabled:opacity-40 hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2"
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
              className="bg-card w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <p className="font-display text-lg text-foreground" style={{ fontWeight: 400 }}>
                  Ce cours est complet
                </p>
                <button
                  onClick={resetBooking}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
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
                      <div className="mb-4 rounded-2xl border border-border bg-secondary/40 p-3 space-y-2">
                        <p className="font-body text-[11px] uppercase tracking-widest text-terra">Sessions les plus proches</p>
                        {alternativeSessions.map((alt) => (
                          <button
                            key={alt.id}
                            type="button"
                            onClick={() => {
                              setShowWaitlist(false);
                              handleSelectSession(alt);
                            }}
                            className="w-full text-left rounded-xl border border-border bg-card px-3 py-2 hover:border-foreground/30 transition-colors"
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
                      className="w-full bg-terra text-warm-white py-3 rounded-full font-body text-xs tracking-widest uppercase disabled:opacity-40 hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2"
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
              className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
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
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => setWantsDrink(!wantsDrink)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${wantsDrink ? "border-terra bg-secondary/20" : "border-border bg-card hover:border-foreground/20"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary/40 flex items-center justify-center">
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
                        className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${selectedDrink === d ? "bg-terra text-warm-white" : "bg-secondary border border-border text-muted-foreground"}`}
                        style={{ fontWeight: 500 }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setWantsMat(!wantsMat)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${wantsMat ? "border-terra bg-secondary/20" : "border-border bg-card hover:border-foreground/20"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary/40 flex items-center justify-center">
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
                  className="w-full bg-terra text-warm-white py-3.5 rounded-full font-body text-xs tracking-widest uppercase hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2"
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
              className="bg-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10 rounded-t-3xl">
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
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
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
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${!payOnSite && !usePackCode ? "border-terra bg-secondary/20" : "border-border bg-card"}`}
                  >
                    <CreditCard size={16} className="text-terra" />
                    <span className="font-body text-sm text-foreground">Payer en ligne (Stripe)</span>
                  </button>
                  <button
                    onClick={() => {
                      setPayOnSite(true);
                      setUsePackCode(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${payOnSite ? "border-terra bg-secondary/20" : "border-border bg-card"}`}
                  >
                    <Clock size={16} className="text-terra" />
                    <span className="font-body text-sm text-foreground">Payer sur place</span>
                  </button>
                  <button
                    onClick={() => {
                      setUsePackCode(true);
                      setPayOnSite(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${usePackCode ? "border-terra bg-secondary/20" : "border-border bg-card"}`}
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
                  className="flex-1 border border-border text-foreground py-3.5 rounded-full font-body text-xs tracking-widest uppercase hover:bg-card transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Retour
                </button>
                <button
                  disabled={!name || !email || !isValidEmail(email) || loading || (usePackCode && !packCode)}
                  onClick={handleSubmit}
                  className="flex-1 bg-terra text-warm-white py-3.5 rounded-full font-body text-xs tracking-widest uppercase disabled:opacity-40 hover:bg-foreground/80 transition-colors"
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
