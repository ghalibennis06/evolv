import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coffee } from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

interface Drink {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  is_available: boolean;
  tags: string[] | null;
  image: string | null;
}

const BoissonsPage = () => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<string | null>(null);

  useEffect(() => {
    api.drinks.list().then((data) => {
      setDrinks(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(drinks.map(d => d.category))];
  const filtered = filterCat ? drinks.filter(d => d.category === filterCat) : drinks;

  return (
    <main className="bg-background min-h-screen">
      <Navbar onBookClick={() => {}} />

      <section className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12"
          >
            <p className="font-body text-[11px] tracking-[0.35em] uppercase text-terra mb-4" style={{ fontWeight: 500 }}>
              Le bar
            </p>
            <h1 className="font-display text-4xl md:text-6xl text-foreground" style={{ fontWeight: 200, letterSpacing: "0.12em" }}>
              Nos <em className="italic text-terra">Boissons</em>
            </h1>
            <p className="font-body text-foreground/70 mt-4 max-w-lg mx-auto" style={{ fontWeight: 400 }}>
              Des boissons artisanales préparées avec soin, à commander lors de votre réservation.
            </p>
          </motion.div>

          {/* Category filters */}
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => setFilterCat(null)}
                className={`px-4 py-1.5 font-body text-[10px] tracking-[0.25em] uppercase transition-all ${
                  !filterCat ? "bg-terra text-warm-white" : "border border-border text-foreground/60 hover:border-foreground/20"
                }`}
                style={{ fontWeight: 400, borderRadius: "2px" }}
              >
                Toutes
              </button>
              {categories.map(c => (
                <button key={c}
                  onClick={() => setFilterCat(filterCat === c ? null : c)}
                  className={`px-4 py-1.5 font-body text-[10px] tracking-[0.25em] uppercase transition-all ${
                    filterCat === c ? "bg-terra text-warm-white" : "border border-border text-foreground/60 hover:border-foreground/20"
                  }`}
                  style={{ fontWeight: 400, borderRadius: "2px" }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <p className="text-center font-body text-foreground/60 py-20" style={{ fontWeight: 400 }}>Chargement...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Coffee size={40} className="text-foreground/30 mx-auto mb-4" />
              <p className="font-body text-foreground/60" style={{ fontWeight: 400 }}>
                Le menu est en préparation. Bientôt disponible !
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[2px]">
              {filtered.map((drink, idx) => (
                <motion.div
                  key={drink.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-card border border-border p-6 hover:border-foreground/15 transition-all"
                  style={{ borderRadius: "2px" }}
                >
                  {drink.image && (
                    <div className="aspect-square mb-4 overflow-hidden" style={{ borderRadius: "2px" }}>
                      <img src={drink.image} alt={drink.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display text-lg text-foreground" style={{ fontWeight: 400 }}>{drink.name}</h3>
                    <span className="font-body text-[9px] tracking-[0.2em] uppercase text-foreground/60 bg-secondary px-2 py-1" style={{ borderRadius: "10px", fontWeight: 400 }}>
                      {drink.category}
                    </span>
                  </div>
                  {drink.description && (
                    <p className="font-body text-[12px] text-foreground/70 leading-[1.7] mb-3" style={{ fontWeight: 400 }}>
                      {drink.description}
                    </p>
                  )}
                  {drink.tags && drink.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {drink.tags.map(tag => (
                        <span key={tag} className="font-body text-[9px] text-terra bg-secondary/40 px-2 py-0.5" style={{ borderRadius: "2px", fontWeight: 500 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="font-display text-lg text-terra" style={{ fontWeight: 300 }}>{drink.price} DH</p>
                </motion.div>
              ))}
            </div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10 font-body text-[11px] text-foreground/50 tracking-[0.2em] uppercase"
            style={{ fontWeight: 400 }}
          >
            Commandez votre boisson au moins 24h à l'avance lors de votre réservation.
          </motion.p>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default BoissonsPage;
