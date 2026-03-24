import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const seg = (n: number) => Array.from({ length: n }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join("");
const generatePackCode = () => `TC-${seg(4)}-${seg(4)}`;

async function createBlackCardFromRequest(supabase: any, request: any, source: "online_payzone" | "paid_on_site") {
  let packCode = "";
  for (let i = 0; i < 8; i++) {
    const candidate = generatePackCode();
    const { data: found } = await supabase.from("packs").select("id").eq("pack_code", candidate).maybeSingle();
    if (!found) {
      packCode = candidate;
      break;
    }
  }
  if (!packCode) throw new Error("Unable to generate unique Black Card code");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const { data: pack, error: packError } = await supabase
    .from("packs")
    .insert({
      pack_code: packCode,
      pack_type: "carte_black",
      client_name: request.client_name || "",
      client_email: request.client_email || "",
      client_phone: request.client_phone || null,
      credits_total: request.credits_total || 10,
      credits_used: 0,
      payment_status: "paid",
      payment_source: source,
      status: "active",
      offer_id: request.offer_id || null,
      request_id: request.id,
      is_active: true,
      expires_at: expiresAt.toISOString(),
      created_by: source,
      notes: `Generated from request ${request.id}`,
    })
    .select()
    .single();

  if (packError) throw packError;

  await supabase
    .from("code_creation_requests")
    .update({
      request_status: "auto_generated",
      payment_status: "paid",
      generated_pack_id: pack.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.id);

  await supabase.from("activity_log").insert([
    {
      actor: "system",
      action: "blackcard_request_approved",
      target_id: request.id,
      metadata: { source },
    },
    {
      actor: "system",
      action: "blackcard_generated",
      target_id: pack.id,
      metadata: { request_id: request.id, pack_code: pack.pack_code, source },
    },
  ]);

  return pack;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    const { session_id, pack_code, order_id, request_id, method } = await req.json();

    if (method === "payzone") {
      if (!order_id && !request_id) {
        return new Response(JSON.stringify({ error: "order_id or request_id required for payzone" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const query = supabase.from("code_creation_requests").select("*");
      const { data: request, error: requestError } = request_id
        ? await query.eq("id", request_id).maybeSingle()
        : await query.eq("payzone_order_id", order_id).maybeSingle();

      if (requestError || !request) throw requestError || new Error("Request not found");

      if (request.generated_pack_id) {
        const { data: existingPack } = await supabase.from("packs").select("pack_code, id").eq("id", request.generated_pack_id).maybeSingle();
        return new Response(JSON.stringify({ verified: true, status: "paid", pack_code: existingPack?.pack_code || null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const pack = await createBlackCardFromRequest(supabase, request, "online_payzone");
      return new Response(JSON.stringify({ verified: true, status: "paid", pack_code: pack.pack_code, pack_id: pack.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ verified: false, status: session.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (pack_code) {
      await supabase
        .from("packs")
        .update({
          is_active: true,
          payment_status: "paid",
          stripe_session_id: session_id,
          payment_intent_id: (session.payment_intent as string) || null,
          status: "active",
          payment_source: "online_payzone",
        })
        .eq("pack_code", pack_code.toUpperCase().trim())
        .eq("payment_status", "pending");
    }

    return new Response(JSON.stringify({ verified: true, status: "paid", pack_activated: !!pack_code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
