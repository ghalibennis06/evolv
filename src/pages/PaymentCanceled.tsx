import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import WhatsAppButton from "@/components/WhatsAppButton";

const PaymentCanceled = () => {
  return (
    <main className="bg-background min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border border-border p-10 max-w-md w-full text-center"
      >
        <XCircle size={56} className="text-accent mx-auto mb-6" />
        <h1 className="font-display text-3xl font-semibold text-foreground mb-3">
          Paiement annulé
        </h1>
        <p className="font-body text-muted-foreground mb-8">
          Votre paiement n'a pas abouti. Aucun montant n'a été débité. Vous pouvez réessayer à tout moment.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/planning" className="w-full bg-primary text-primary-foreground py-3 rounded-full font-body text-sm font-semibold hover:bg-accent transition-colors">
            Réessayer la réservation
          </Link>
          <Link to="/" className="w-full border border-border text-foreground py-3 rounded-full font-body text-sm font-medium hover:bg-card transition-colors inline-flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
        </div>
      </motion.div>
      <WhatsAppButton />
    </main>
  );
};

export default PaymentCanceled;
