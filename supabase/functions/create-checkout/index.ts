// supabase/functions/create-checkout/index.ts
// FIX BUG 2 & 3 — Pack sauvé en DB + format code TC-XXXX-XXXX unifié
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Même générateur que l'admin — format TC-XXXX-XXXX
function generatePackCode(): string {
  const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) =>
    Array.from({ length: n }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join("");
  return `TC-${seg(4)}-${seg(4)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");

    const { priceId, mode, clientName, clientEmail, clientPhone, bookingData, packData } = await req.json();

    if (!priceId || !clientEmail) {
      throw new Error("Missing required fields: priceId, clientEmail");
    }

    const origin = req.headers.get("origin") || "https://thecircle.ma";

    const metadata: Record<string, string> = {
      client_name: clientName || "",
      client_email: clientEmail,
      client_phone: clientPhone || "",
    };

    let packCode: string | null = null;

    if (packData) {
      // FIX BUG 3 : Utiliser le bon format TC-XXXX-XXXX
      // Générer code unique en vérifiant l'unicité
      let exists = true;
      do {
        packCode = generatePackCode();
        const { data: found } = await supabase.from("packs").select("id").eq("pack_code", packCode).maybeSingle();
        exists = !!found;
      } while (exists);

      // FIX BUG 2 : Sauvegarder le pack en DB MAINTENANT (avant Stripe)
      // Statut 'pending' → sera mis à 'paid' quand Stripe confirme (via /payment-success)
      const PACK_CONFIG: Record<string, { validity_days: number }> = {
        carte_black: { validity_days: 90 },
        pack_5: { validity_days: 60 },
        pack_single: { validity_days: 30 },
      };
      const packType =
        packData.pack_type ||
        (packData.credits === 10 ? "carte_black" : packData.credits === 5 ? "pack_5" : "pack_single");
      const validity = PACK_CONFIG[packType]?.validity_days || 90;
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + validity);

      const { error: packInsertError } = await supabase.from("packs").insert({
        pack_code: packCode,
        pack_type: packType,
        client_name: clientName || "",
        client_email: clientEmail,
        client_phone: clientPhone || null,
        credits_total: packData.credits,
        credits_used: 0,
        payment_status: "pending", // sera mis à jour sur /payment-success
        expires_at: expires_at.toISOString(),
        created_by: "stripe",
        is_active: false, // activé seulement après confirmation paiement
      });

      if (packInsertError) {
        console.error("Pack insert error:", packInsertError);
        // Ne pas bloquer le flow — le pack sera créé via webhook si disponible
      }

      metadata.pack_code = packCode;
      metadata.pack_type = packType;
      metadata.credits = String(packData.credits);
      metadata.type = "pack";
    }

    if (bookingData) {
      metadata.booking_data = JSON.stringify(bookingData);
      metadata.type = "booking";
    }

    // Chercher client Stripe existant
    const customers = await stripe.customers.list({ email: clientEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const successUrl = packCode
      ? `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&pack_code=${packCode}`
      : `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : clientEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode || "payment",
      success_url: successUrl,
      cancel_url: `${origin}/payment-canceled`,
      metadata,
    });

    return new Response(JSON.stringify({ url: session.url, packCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
