/**
 * ── Payzone.ma Integration ──────────────────────────────────────
 * Payzone is a Moroccan payment gateway (payzone.ma).
 * Integration pattern: redirect to hosted payment page.
 * ────────────────────────────────────────────────────────────────
 */

export interface PayzoneConfig {
  merchantId: string;
  secretKey: string;
  baseUrl?: string;
}

export interface PayzoneOrderParams {
  orderId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl?: string;
  language?: "fr" | "ar" | "en";
}

// ── Client-side redirect builder ─────────────────────────────────
export function buildPayzoneRedirectForm(
  paymentUrl: string,
  params: Record<string, string>
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;

  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

// ── Supabase Edge Function wrapper ───────────────────────────────
import { supabase } from "@/integrations/supabase/client";

export interface PayzoneSession {
  paymentUrl: string;
  orderId: string;
  expiresAt: string;
}

export async function createPayzoneSession(params: {
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  packType?: string;
  packCredits?: number;
  offerId?: string;
  offerName?: string;
  returnPath?: string;
}): Promise<PayzoneSession> {
  const origin = window.location.origin;

  const { data, error } = await supabase.functions.invoke("create-payzone-session", {
    body: {
      ...params,
      returnUrl: `${origin}${params.returnPath || "/paiement-succes"}`,
      cancelUrl: `${origin}/paiement-annule`,
      notifyUrl: `${origin}/api/payzone-notify`,
      currency: "MAD",
      language: "fr",
    },
  });

  if (error) throw error;
  if (!data?.paymentUrl) throw new Error("Payzone: URL de paiement manquante");

  return data as PayzoneSession;
}

// ── Order ID generator ────────────────────────────────────────────
export function generateOrderId(prefix = "TC"): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

// ── Amount helpers ────────────────────────────────────────────────
export const toPayzoneCentimes = (amountMAD: number) => Math.round(amountMAD * 100);
export const fromPayzoneCentimes = (centimes: number) => centimes / 100;

// ── Payment status mapping ────────────────────────────────────────
export const PAYZONE_STATUS: Record<string, { label: string; color: string }> = {
  "00": { label: "Approuvé", color: "text-[#4E9E7A]" },
  "05": { label: "Refusé", color: "text-destructive" },
  "12": { label: "Transaction invalide", color: "text-destructive" },
  "14": { label: "Numéro invalide", color: "text-destructive" },
  "51": { label: "Solde insuffisant", color: "text-[#D4A853]" },
  "54": { label: "Carte expirée", color: "text-destructive" },
  "68": { label: "Timeout", color: "text-muted-foreground" },
  pending: { label: "En attente", color: "text-[#D4A853]" },
};
