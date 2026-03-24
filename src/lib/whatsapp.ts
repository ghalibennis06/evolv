// ─────────────────────────────────────────────────────────────
// FIX BUG 1 & 7 — Remplacer le faux numéro par le vrai
// ⚠️ CHANGER LA VALEUR CI-DESSOUS par le vrai numéro WhatsApp du studio
// Format : code pays sans + ni 00, ex: 212661234567
// ─────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "33668710966";

export const generateWhatsAppUrl = (message: string) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const buildBookingConfirmationMessage = (data: {
  name: string;
  day: string;
  time: string;
  className: string;
  coach: string;
  packCode?: string;
  creditsRemaining?: number;
  creditsTotal?: number;
  paymentMethod?: string;
  drinkName?: string;
}) => {
  let msg = `🧘 *Confirmation de réservation — The Circle*\n\n`;
  msg += `👤 Nom : ${data.name}\n`;
  msg += `📅 ${data.day} à ${data.time}\n`;
  msg += `🏋️ ${data.className} avec ${data.coach}\n`;

  if (data.drinkName) {
    msg += `☕ Boisson réservée : ${data.drinkName}\n`;
  }

  if (data.packCode) {
    msg += `\n🎫 *Pack utilisé : ${data.packCode}*\n`;
    msg += `📊 Crédits restants : ${data.creditsRemaining}/${data.creditsTotal}\n`;
    if (data.creditsRemaining !== undefined && data.creditsRemaining <= 2) {
      msg += `⚠️ Il ne vous reste que ${data.creditsRemaining} crédit(s) — pensez à renouveler !\n`;
    }
  } else if (data.paymentMethod === "on_site") {
    msg += `\n💳 Paiement sur place\n`;
  } else {
    msg += `\n💳 Paiement en ligne effectué\n`;
  }

  msg += `\n📌 *Politique d'annulation :* Annulation gratuite jusqu'à 2h avant le cours. Passé ce délai, la séance est décomptée de votre pack.`;
  msg += `\n\n✅ À bientôt au studio !`;
  return msg;
};

export const buildWaitlistMessage = (data: { name: string; className: string; day: string; time: string }) => {
  let msg = `📋 *Inscription liste d'attente — The Circle*\n\n`;
  msg += `👤 ${data.name}\n`;
  msg += `📅 ${data.day} à ${data.time}\n`;
  msg += `🏋️ ${data.className}\n`;
  msg += `\nNous vous contacterons dès qu'une place se libère.`;
  return msg;
};

export const buildPackPurchaseMessage = (data: {
  name: string;
  packCode: string;
  credits: number;
  expiryDate?: string;
}) => {
  let msg = `🎉 *Achat de pack confirmé — The Circle*\n\n`;
  msg += `👤 ${data.name}\n`;
  msg += `🎫 Code pack : *${data.packCode}*\n`;
  msg += `📊 Crédits : ${data.credits} séances\n`;
  if (data.expiryDate) {
    msg += `📅 Valable jusqu'au : ${data.expiryDate}\n`;
  }
  msg += `\n📌 Conservez ce code pour réserver vos séances sur thecircle.ma/reserver\n`;
  msg += `\n✅ Merci et à bientôt !`;
  return msg;
};

export const generatePackWhatsApp = (pack: {
  client_name: string;
  client_phone?: string | null;
  pack_code: string;
  pack_type: string;
  credits_total: number;
  expires_at?: string | null;
}) => {
  const expiry = pack.expires_at
    ? new Date(pack.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const message = buildPackPurchaseMessage({
    name: pack.client_name,
    packCode: pack.pack_code,
    credits: pack.credits_total,
    expiryDate: expiry,
  });

  const phone = (pack.client_phone || "").replace(/\D/g, "");
  const intlPhone = phone.startsWith("212") ? phone : "212" + phone.slice(1);
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
};
