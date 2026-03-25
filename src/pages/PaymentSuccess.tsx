import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, MessageCircle, Loader2, Ticket } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
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
        const data = await api.payment.verify({
          request_id: requestId ?? undefined,
          order_id: orderId ?? undefined,
        });
        if (data?.verified) {
          setVerified(true);
          const finalCode = data?.pack_code ?? packCode;
          if (finalCode) setGeneratedPackCode(finalCode);
          // Email confirmation removed — no email service yet
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
                <Link to="/mon-pack" className="w-full border border-terra text-terra py-3 rounded-full font-body text-sm font-medium hover:bg-foreground hover:text-white transition-colors inline-flex items-center justify-center gap-2">
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
