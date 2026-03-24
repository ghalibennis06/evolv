import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Instagram, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AdminFab from "@/components/AdminFab";
import MeridianLogo from "@/components/brand/MeridianLogo";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const iCls = "w-full bg-secondary/30 border border-border px-4 py-4 font-body text-[13px] text-foreground focus:border-foreground outline-none transition-colors placeholder:text-muted-foreground/50 rounded-none";

const buildContactEmailHtml = (name: string, email: string, phone: string, subject: string, message: string) => `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#faf9f7;border-radius:16px">
  <div style="margin-bottom:24px">
    <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#1C1C1C;margin:0 0 4px">EVØLV Studio</p>
    <h2 style="font-size:22px;font-weight:300;color:#1a1a18;margin:0">Nouveau message reçu</h2>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e2dd;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9c9488;width:120px">Nom</td><td style="padding:8px 0;border-bottom:1px solid #e5e2dd;font-size:13px;color:#1a1a18">${name}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e2dd;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9c9488">Email</td><td style="padding:8px 0;border-bottom:1px solid #e5e2dd;font-size:13px;color:#1a1a18">${email}</td></tr>
    ${phone ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e2dd;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9c9488">Téléphone</td><td style="padding:8px 0;border-bottom:1px solid #e5e2dd;font-size:13px;color:#1a1a18">${phone}</td></tr>` : ""}
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e2dd;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9c9488">Objet</td><td style="padding:8px 0;border-bottom:1px solid #e5e2dd;font-size:13px;color:#1a1a18">${subject}</td></tr>
  </table>
  <div style="background:#fff;border:1px solid #e5e2dd;border-radius:12px;padding:20px;margin-bottom:24px">
    <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9c9488;margin:0 0 10px">Message</p>
    <p style="font-size:14px;color:#1a1a18;line-height:1.7;margin:0;white-space:pre-wrap">${message}</p>
  </div>
  <p style="font-size:11px;color:#9c9488;margin:0">Répondre directement à cet email pour contacter ${name}.</p>
</div>`;

const buildConfirmHtml = (name: string) => `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#faf9f7;border-radius:16px;text-align:center">
  <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#1C1C1C;margin:0 0 16px">EVØLV Studio</p>
  <h2 style="font-size:24px;font-weight:300;color:#1a1a18;margin:0 0 12px">Message reçu, ${name.split(" ")[0]}</h2>
  <p style="font-size:14px;color:#6b6560;line-height:1.7;margin:0 0 24px">Nous avons bien reçu votre message et vous répondrons dans les meilleurs délais.</p>
  <a href="#" style="display:inline-block;background:#1C1C1C;color:#fff;padding:12px 28px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;text-decoration:none">Voir le planning →</a>
  <p style="font-size:11px;color:#9c9488;margin:28px 0 0">Casablanca · Maroc</p>
</div>`;

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "Renseignements", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const content = useSiteContent("contact", {
    address: "EVØLV Pilates Studio\nCasablanca, Maroc",
    phone: "+212 6XX XXX XXX",
    email: "hello@evolv.ma",
    hours_weekday: "Lundi – Vendredi : 10h00 – 20h00",
    hours_saturday: "Samedi : 09h00 – 18h00",
    hours_sunday: "Dimanche : 10h00 – 18h00",
    whatsapp: "212600000000",
    instagram: "evolv.studio",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      // Fetch studio destination email from studio_config
      const { data: cfgRow } = await supabase
        .from("site_content")
        .select("value")
        .eq("section", "studio_config")
        .eq("key", "config")
        .maybeSingle();
      const studioEmail = (cfgRow?.value as any)?.email_studio || "ghali.bennis06@gmail.com";

      // Notification to studio
      await supabase.functions.invoke("send-email", {
        body: {
          to: studioEmail,
          replyTo: form.email,
          subject: `[Contact] ${form.subject} — ${form.name}`,
          html: buildContactEmailHtml(form.name, form.email, form.phone, form.subject, form.message),
        },
      });
      // Confirmation to sender
      await supabase.functions.invoke("send-email", {
        body: {
          to: form.email,
          subject: "Message reçu — EVØLV Studio",
          html: buildConfirmHtml(form.name),
        },
      });
      setSent(true);
    } catch (err: any) {
      toast.error("Erreur d'envoi. Réessayez ou contactez-nous par WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="bg-background min-h-screen overflow-x-hidden">
      <Navbar onBookClick={() => {}} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 60% 30%, rgba(184,99,74,0.10) 0%, transparent 55%), radial-gradient(ellipse at 20% 70%, rgba(122,48,64,0.08) 0%, transparent 50%)" }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.07, zIndex: 0 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 100, repeat: Infinity, ease: "linear" }}>
            <MeridianLogo size={500} variant="theme" animate={false} />
          </motion.div>
        </div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}>
            <p className="font-body text-[10px] tracking-[0.55em] uppercase text-foreground/60 mb-6" style={{ fontWeight: 500 }}>Nous trouver</p>
            <h1 className="font-display text-foreground" style={{ fontSize: "clamp(48px, 9vw, 110px)", fontWeight: 200, letterSpacing: "0.06em", lineHeight: 0.92 }}>
              Venez nous<br /><em className="italic text-foreground/60">voir.</em>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Main grid */}
      <section className="px-6 pb-24">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-12 md:gap-20">

            {/* Left: infos */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }} className="space-y-10">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <MapPin size={13} className="text-foreground/60 shrink-0" />
                  <p className="font-body text-[10px] tracking-[0.35em] uppercase text-foreground/60" style={{ fontWeight: 500 }}>Adresse</p>
                </div>
                <p className="font-display text-foreground leading-[1.5]" style={{ fontSize: "22px", fontWeight: 300, letterSpacing: "0.04em" }}>{content.address as string}</p>
                <a href={`https://maps.google.com/?q=${encodeURIComponent((content.address as string) || "El Menzeh Rabat")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 font-body text-[10px] tracking-[0.25em] uppercase text-foreground/60/70 hover:text-foreground/60 transition-colors" style={{ fontWeight: 400 }}>
                  Voir sur Maps →
                </a>
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <Clock size={13} className="text-foreground/60 shrink-0" />
                  <p className="font-body text-[10px] tracking-[0.35em] uppercase text-foreground/60" style={{ fontWeight: 500 }}>Horaires</p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-body text-foreground/80" style={{ fontSize: "14px", fontWeight: 300 }}>{content.hours_weekday as string}</p>
                  <p className="font-body text-foreground/80" style={{ fontSize: "14px", fontWeight: 300 }}>{content.hours_saturday as string}</p>
                  <p className="font-body text-foreground/50 italic" style={{ fontSize: "13px", fontWeight: 300 }}>{content.hours_sunday as string}</p>
                </div>
              </div>

              <div>
                <p className="font-body text-[10px] tracking-[0.35em] uppercase text-foreground/60 mb-3" style={{ fontWeight: 500 }}>Contact direct</p>
                <div className="space-y-3">
                  <a href={`https://wa.me/${(content.whatsapp as string) || "212600000000"}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-none border border-foreground/15 hover:border-foreground/40 transition-all group">
                    <div className="w-9 h-9 rounded-full bg-secondary/40 flex items-center justify-center group-hover:bg-foreground/20 transition-colors">
                      <MessageCircle size={15} className="text-foreground/60" />
                    </div>
                    <div>
                      <p className="font-body text-[11px] tracking-[0.2em] uppercase text-foreground" style={{ fontWeight: 500 }}>WhatsApp</p>
                      <p className="font-body text-[12px] text-muted-foreground" style={{ fontWeight: 300 }}>{content.phone as string}</p>
                    </div>
                  </a>
                  <a href={`https://instagram.com/${(content.instagram as string) || "thecirclestudio"}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-none border border-border hover:border-foreground/20 hover:bg-foreground/3 transition-all group">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center group-hover:bg-secondary/50 transition-colors">
                      <Instagram size={15} className="text-foreground/60 group-hover:text-foreground/60 transition-colors" />
                    </div>
                    <div>
                      <p className="font-body text-[11px] tracking-[0.2em] uppercase text-foreground" style={{ fontWeight: 500 }}>Instagram</p>
                      <p className="font-body text-[12px] text-muted-foreground" style={{ fontWeight: 300 }}>@{content.instagram as string}</p>
                    </div>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Right: contact form */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}>
              {sent ? (
                <div className="p-10 rounded-none border border-terra/25 bg-secondary/20 text-center space-y-4">
                  <CheckCircle size={36} className="text-foreground/60 mx-auto" />
                  <h3 className="font-display text-foreground" style={{ fontSize: "24px", fontWeight: 200, letterSpacing: "0.06em" }}>Message envoyé</h3>
                  <p className="font-body text-[13px] text-muted-foreground" style={{ fontWeight: 300 }}>Nous vous répondrons dans les meilleurs délais. Un email de confirmation vous a été envoyé.</p>
                  <button onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "Renseignements", message: "" }); }}
                    className="font-body text-[10px] tracking-[0.25em] uppercase text-foreground/60 hover:text-foreground/60/70 transition-colors" style={{ fontWeight: 400 }}>
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <p className="font-body text-[10px] tracking-[0.4em] uppercase text-foreground/60 mb-5" style={{ fontWeight: 500 }}>Nous écrire</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className={iCls}
                      placeholder="Nom complet *"
                    />
                    <input
                      required type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={iCls}
                      placeholder="Email *"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className={iCls}
                      placeholder="Téléphone (optionnel)"
                    />
                    <select
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className={iCls + " cursor-pointer"}
                    >
                      <option>Renseignements</option>
                      <option>Réservation de groupe</option>
                      <option>Partenariat</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className={iCls + " resize-none"}
                    placeholder="Votre message *"
                  />
                  <button type="submit" disabled={sending || !form.name || !form.email || !form.message}
                    className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-4 font-body text-[10px] tracking-[0.25em] uppercase hover:bg-foreground/80 transition-all disabled:opacity-50"
                    style={{ fontWeight: 500 }}>
                    {sending ? (
                      <span className="flex items-center gap-2"><svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Envoi en cours…</span>
                    ) : (
                      <><Send size={13} /> Envoyer le message</>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Google Maps */}
      <section className="px-6 pb-24">
        <div className="container mx-auto max-w-4xl">
          <p className="font-body text-[10px] tracking-[0.4em] uppercase text-foreground/60 mb-4" style={{ fontWeight: 500 }}>Nous trouver</p>
          <div className="rounded-none overflow-hidden border border-border shadow-sm" style={{ height: 340 }}>
            <iframe
              title="EVØLV Studio — El Menzeh Rabat"
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://maps.google.com/maps?q=El+Menzeh+Rabat+Maroc&t=&z=15&ie=UTF8&iwloc=&output=embed"
            />
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
      <AdminFab />
    </main>
  );
};

export default ContactPage;
