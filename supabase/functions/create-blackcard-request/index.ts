import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const isUuid = (value?: string | null) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase credentials are not configured for create-blackcard-request");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { client_name, client_email, client_phone, offer_id, offer_name, credits_total, payment_method = "cash_on_site" } = await req.json();

    if (!client_name || !offer_name || (!client_email && !client_phone)) {
      throw new Error("Missing required fields: name + offer + (email or phone)");
    }

    const { data, error } = await supabase
      .from("code_creation_requests")
      .insert({
        client_name,
        client_email: client_email || null,
        client_phone: client_phone || null,
        offer_id: isUuid(offer_id) ? offer_id : null,
        offer_name,
        credits_total: credits_total || 10,
        payment_method,
        payment_status: payment_method === "online" ? "paid" : "pending",
        request_source: "frontend",
        request_status: "pending",
        metadata: { created_from: "carte-black-page" },
      })
      .select("id")
      .single();
    if (error) throw error;

    await supabase.from("activity_log").insert({
      actor: "frontend",
      action: "blackcard_request_created",
      target_id: data.id,
      metadata: { payment_method },
    });

    return new Response(JSON.stringify({ success: true, request_id: data.id }), {
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
