import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, MessageCircle, Loader2, Ticket } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateWhatsAppUrl } from "@/lib/whatsapp";
import WhatsAppButton from "@/components/WhatsAppButton";
import MeridianLogo from "@/components/brand/MeridianLogo";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const method = searchParams.get("method");
  const sessionId = searchParams.get("session_id");
  const packCode = searchParams.get("pack_code");
  const orderId = searchParams.get("order_id");
  const requestId = searchParams.get("request_id");
  const [generatedPackCode, setGeneratedPackCode] = useState<string | null>(packCode);
  const shouldVerify = !!sessionId || (method === "payzone" && (!!orderId || !!requestId));
  const [verifying, setVerifying] = useState(shouldVerify);
  const [verified, setVerified] = useState(!shouldVerify);

  const isPack = method === "pack" || method === "payzone" || !!packCode;
  const isOnSite = method === "on_site";

  const cardLink = generatedPackCode
    ? `/mon-pack`
    : "/mon-pack";

  // Verify Stripe payment and activate pack if applicable
  useEffect(() => {
    if (!shouldVerify) return;
    
    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: {
            session_id: sessionId,
            pack_code: packCode,
            method,
            order_id: orderId,
            request_id: requestId,
          },
        });
        if (!error && data?.verified) {
          setVerified(true);
          const finalCode = data?.pack_code ?? packCode;
          if (finalCode) setGeneratedPackCode(finalCode);

          // Send confirmation email if we have client info from verify-payment
          if (data?.client_email) {
            supabase.functions.invoke("send-email", {
              body: {
                to: data.client_email,
                subject: finalCode ? "🎫 Votre Carte The Circle est activée !" : "✅ Réservation confirmée — The Circle",
                html: `
                  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FAF6F1;border-radius:16px">
                    <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#B8634A;margin:0 0 6px">The Circle</p>
                    <h1 style="font-size:22px;font-weight:300;letter-spacing:0.08em;color:#1A1714;margin:0 0 24px">
                      ${finalCode ? "Votre carte est activée" : "Réservation confirmée"}
                    </h1>
                    <p style="color:#3D3530;font-size:15px;margin:0 0 16px">Bonjour ${data.client_name ?? ""},</p>
                    ${finalCode ? `
                    <div style="background:#1A1714;border-radius:12px;padding:20px;margin:0 0 20px;text-align:center">
                      <p style="color:rgba(250,246,241,0.4);font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px">Votre code</p>
                      <p style="color:#FAF6F1;font-size:24px;font-family:monospace;letter-spacing:0.15em;margin:0;font-weight:300">${finalCode}</p>
                    </div>
                    <p style="font-size:13px;color:#3D3530;margin:0 0 16px">Conservez ce code précieusement — il vous servira pour chaque réservation sur <a href="https://thecirclestudio.vercel.app/planning" style="color:#B8634A">thecircle.ma/reserver</a>.</p>
                    ` : ""}
                    <p style="font-size:12px;color:#6B605A;line-height:1.6;margin:0 0 24px">📌 Annulation gratuite jusqu'à 2h avant chaque cours.</p>
                    <a href="https://thecirclestudio.vercel.app/planning" style="display:inline-block;background:#B8634A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">Réserver une séance</a>
                  </div>`,
              },
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Payment verification error:", err);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [sessionId, packCode, shouldVerify, method, orderId, requestId]);

  const confirmWhatsAppMsg = isPack
    ? `✅ J'ai acheté une formule pack${generatedPackCode ? ` (code: ${generatedPackCode})` : ""}. Merci de confirmer l'activation !`
    : isOnSite
    ? "✅ J'ai réservé une séance avec paiement sur place. Merci de confirmer !"
    : "✅ J'ai effectué un paiement en ligne pour ma réservation. Merci de confirmer !";

  return (
    <main className="bg-background min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border border-border p-10 max-w-md w-full text-center"
      >
        {verifying ? (
          <div className="py-8">
            <MeridianLogo size={56} variant="sand" animate spinDuration={4} className="mx-auto mb-4" />
            <p className="font-body text-muted-foreground text-sm">Vérification du paiement...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <MeridianLogo size={64} variant="sand" animate spinDuration={10} glowAnimation />
            </div>
            <CheckCircle size={32} className="text-terra mx-auto mb-4" />
            <h1 className="font-display text-3xl text-foreground mb-3" style={{ fontWeight: 400 }}>
              {isPack ? "Pack activé !" : "Réservation confirmée !"}
            </h1>
            <p className="font-body text-muted-foreground mb-6">
              {isPack && generatedPackCode
                ? `Votre code pack : ${generatedPackCode}. Utilisez-le lors de vos réservations.`
                : isPack
                ? "Un crédit a été déduit de votre pack."
                : "Merci pour votre réservation."}
            </p>

            <div className="bg-muted/50 rounded-xl p-5 mb-6 font-body text-sm text-muted-foreground text-left space-y-2">
              {isPack && generatedPackCode && (
                <p className="text-terra font-medium">🎫 Code : {generatedPackCode}</p>
              )}
              <p>💬 Envoyez un message WhatsApp pour finaliser.</p>
              <p>❌ Annulation possible jusqu'à 2h avant via WhatsApp.</p>
              <p>✅ Le cours est confirmé à partir de 2 participants.</p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={generateWhatsAppUrl(confirmWhatsAppMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white py-3 rounded-full font-body text-sm font-semibold hover:bg-[#20BD5A] transition-colors inline-flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> Confirmer sur WhatsApp
              </a>
              {isPack && (
                <Link to="/mon-pack" className="w-full border border-terra text-terra py-3 rounded-full font-body text-sm font-medium hover:bg-terra hover:text-white transition-colors inline-flex items-center justify-center gap-2">
                  <Ticket size={16} /> Consulter ma carte
                </Link>
              )}
              <Link to="/" className="w-full border border-border text-foreground py-3 rounded-full font-body text-sm font-medium hover:bg-card transition-colors inline-flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Retour à l'accueil
              </Link>
            </div>
          </>
        )}
      </motion.div>
      <WhatsAppButton />
    </main>
  );
};

export default PaymentSuccess;
