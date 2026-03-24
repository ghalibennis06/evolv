// supabase/functions/use-pack-credit/index.ts
// FIX BUG 4 — email optionnel, validation par code uniquement
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // FIX: clientEmail est maintenant optionnel — le code seul suffit
    const { packCode, clientEmail } = body;

    if (!packCode) {
      return new Response(JSON.stringify({ error: "Code pack requis", code: "MISSING_FIELDS" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");

    // Chercher le pack par code
    const { data: pack, error: findError } = await supabase
      .from("packs")
      .select("*")
      .eq("pack_code", packCode.toUpperCase().trim())
      .single();

    if (findError || !pack) {
      return new Response(
        JSON.stringify({ error: "Code pack invalide. Vérifiez votre code et réessayez.", code: "NOT_FOUND" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    // Vérifications dans l'ordre
    if (pack.is_active === false) {
      return new Response(JSON.stringify({ error: "Ce code a été désactivé.", code: "INACTIVE" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    if (pack.payment_status !== "paid" && pack.payment_status !== "pay_on_site" && pack.payment_status !== "free") {
      return new Response(JSON.stringify({ error: "Ce pack n'a pas encore été payé.", code: "NOT_PAID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (pack.expires_at && new Date(pack.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Ce pack a expiré.", code: "EXPIRED" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const creditsRemaining = pack.credits_total - pack.credits_used;
    if (creditsRemaining <= 0) {
      return new Response(JSON.stringify({ error: "Ce pack n'a plus de crédits disponibles.", code: "DEPLETED" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Déduire 1 crédit
    const newCreditsUsed = pack.credits_used + 1;
    const newRemaining = pack.credits_total - newCreditsUsed;

    const { error: updateError } = await supabase
      .from("packs")
      .update({ credits_used: newCreditsUsed })
      .eq("id", pack.id);

    if (updateError) {
      throw new Error("Erreur lors de la mise à jour du pack: " + updateError.message);
    }

    // Logguer l'utilisation
    await supabase.from("pack_usage_log").insert({
      pack_id: pack.id,
      pack_code: pack.pack_code,
      session_id: body.session_id || null,
      session_title: body.session_title || null,
      session_date: body.session_date || null,
      session_time: body.session_time || null,
      used_by_name: body.client_name || pack.client_name,
      used_by_phone: body.client_phone || pack.client_phone || null,
    });

    await supabase.from("blackcard_usage").insert({
      blackcard_id: pack.id,
      client_id: clientEmail || null,
      client_email: clientEmail || pack.client_email || null,
      session_id: body.session_id || null,
    });

    await supabase.from("activity_log").insert({
      actor: "system",
      action: "blackcard_used",
      target_id: pack.id,
      metadata: {
        pack_code: pack.pack_code,
        session_id: body.session_id || null,
        client_email: clientEmail || pack.client_email || null,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        packCode: pack.pack_code,
        creditsUsed: newCreditsUsed,
        creditsTotal: pack.credits_total,
        creditsRemaining: newRemaining,
        clientName: pack.client_name,
        clientPhone: pack.client_phone,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
