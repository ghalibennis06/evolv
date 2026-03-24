export type PackType = "carte_black" | "duo" | "pack_5" | "pack_single" | "offert" | "custom";

export const PACK_CONFIG: Record<
  PackType,
  { credits: number; label: string; price: number; validity_days: number; duo?: boolean; description?: string }
> = {
  carte_black: {
    credits: 10,
    label: "Carte Black · Reformer Signature",
    price: 1800,
    validity_days: 90,
    description: "10 séances Reformer. Un code unique. 90 jours de validité.",
  },
  duo: {
    credits: 20,
    label: "Code Duo · 2 × Carte Black",
    price: 3000,
    validity_days: 90,
    duo: true,
    description:
      "Un seul code pour réserver 2 places simultanément. Idéal pour venir à deux. Consomme 2 crédits par réservation.",
  },
  pack_5: {
    credits: 5,
    label: "Pack 5 Séances",
    price: 950,
    validity_days: 60,
    description: "5 séances au choix. Valable 60 jours.",
  },
  pack_single: {
    credits: 1,
    label: "Séance à l'unité",
    price: 200,
    validity_days: 30,
    description: "1 séance valable 30 jours.",
  },
  offert: {
    credits: 1,
    label: "Séance Offerte",
    price: 0,
    validity_days: 30,
    description: "Séance offerte — ne pas facturer.",
  },
  custom: {
    credits: 0,
    label: "Pack Personnalisé",
    price: 0,
    validity_days: 90,
    description: "Nombre de crédits personnalisé.",
  },
};

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePackCode(): string {
  const segment = (n: number) =>
    Array.from({ length: n }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join("");
  return `TC-${segment(4)}-${segment(4)}`;
}

export function getExpiryDate(validityDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + validityDays);
  return date.toISOString();
}
