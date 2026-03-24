import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean | null;
  stripe_price_id: string | null;
}

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const BoutiquePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [buyForm, setBuyForm] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*").eq("in_stock", true);
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleBuy = async (product: Product) => {
    if (!product.stripe_price_id) {
      alert("Ce produit n'est pas encore disponible à l'achat en ligne. Contactez-nous via WhatsApp.");
      return;
    }
    setBuyingId(product.id);
    setBuyForm({ name: "", email: "" });
  };

  const handleConfirmBuy = async (product: Product) => {
    if (!buyForm || !buyForm.name || !buyForm.email) return;
    if (!isValidEmail(buyForm.email)) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: product.stripe_price_id,
          mode: "payment",
          clientName: buyForm.name,
          clientEmail: buyForm.email,
        },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      alert("Erreur lors de la commande.");
      console.error(err);
    }
  };

  return (
    <main className="bg-background min-h-screen">
      <Navbar onBookClick={() => {}} />

      <section className="pt-28 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <p className="font-body text-sm tracking-[0.25em] uppercase text-primary mb-4">The Circle</p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4">
              Boutique
            </h1>
            <p className="font-body text-muted-foreground">
              Découvrez notre sélection d'accessoires et produits bien-être.
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <p className="font-body text-muted-foreground">Chargement...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={48} className="text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-body text-muted-foreground">
                La boutique est en préparation. Restez connectés !
              </p>
              <p className="font-body text-sm text-muted-foreground mt-2">
                En attendant, retrouvez nos produits directement au studio.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden group"
                >
                  {product.image_url && (
                    <div className="aspect-square bg-beige overflow-hidden">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                  )}
                  <div className="p-6">
                    {product.category && (
                      <span className="font-body text-xs text-primary font-semibold uppercase tracking-wider">{product.category}</span>
                    )}
                    <h3 className="font-display text-xl font-semibold text-foreground mt-1 mb-2">{product.name}</h3>
                    {product.description && (
                      <p className="font-body text-sm text-muted-foreground mb-4">{product.description}</p>
                    )}

                    {buyingId === product.id && buyForm ? (
                      <div className="space-y-3">
                        <input
                          value={buyForm.name}
                          onChange={(e) => setBuyForm({ ...buyForm, name: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          placeholder="Votre nom"
                        />
                        <input
                          value={buyForm.email}
                          onChange={(e) => setBuyForm({ ...buyForm, email: e.target.value })}
                          type="email"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          placeholder="votre@email.com"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setBuyingId(null); setBuyForm(null); }}
                            className="flex-1 border border-border text-muted-foreground py-2 rounded-full font-body text-xs hover:bg-card transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            disabled={!buyForm.name || !buyForm.email || !isValidEmail(buyForm.email)}
                            onClick={() => handleConfirmBuy(product)}
                            className="flex-1 bg-primary text-primary-foreground py-2 rounded-full font-body text-xs font-semibold disabled:opacity-40 hover:bg-accent transition-colors"
                          >
                            Confirmer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-display text-2xl font-bold text-primary">{product.price} DH</span>
                        <button
                          onClick={() => handleBuy(product)}
                          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-body text-xs font-semibold hover:bg-accent transition-colors"
                        >
                          Acheter
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default BoutiquePage;
