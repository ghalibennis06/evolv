import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYZONE_BASE = "https://paiement.payzone.ma";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const {
      amount,
      description,
      customerName,
      customerEmail,
      customerPhone,
      packType,
      packCredits,
      offerId,
      offerName,
      returnUrl,
      cancelUrl,
      notifyUrl,
      currency = "MAD",
      language = "fr",
    } = await req.json();

    if (!amount || !customerEmail) {
      throw new Error("Missing required fields: amount, customerEmail");
    }

    // Generate order ID
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderId = `TC-${ts}-${rand}`;

    // Insert DB record FIRST so we always have a trace, even if Payzone credentials are missing
    let requestId: string | null = null;
    if (packType && packCredits) {
      const pricingQuery = supabase.from("pricing").select("id, name").eq("is_active", true);
      const { data: pricing } = offerId
        ? await pricingQuery.eq("id", offerId).maybeSingle()
        : await pricingQuery.eq("sessions_included", packCredits).order("sort_order", { ascending: true }).limit(1).maybeSingle();

      const { data: reqData, error: reqErr } = await supabase
        .from("code_creation_requests")
        .insert({
          client_name: customerName || "",
          client_email: customerEmail,
          client_phone: customerPhone || null,
          offer_id: pricing?.id || offerId || null,
          offer_name: pricing?.name || offerName || packType,
          credits_total: packCredits,
          payment_method: "online",
          payment_status: "pending",
          request_source: "frontend",
          request_status: "pending",
          payzone_order_id: orderId,
          metadata: { description, amount, currency, language, packType },
        })
        .select("id")
        .single();
      if (reqErr) throw reqErr;
      requestId = reqData.id;

      await supabase.from("activity_log").insert({
        actor: "frontend",
        action: "blackcard_request_created",
        target_id: requestId,
        metadata: { payment_method: "online", packType, orderId },
      });
    }

    // Check Payzone credentials AFTER DB insert so the request is always logged
    const MERCHANT_ID = Deno.env.get("PAYZONE_MERCHANT_ID") || "";
    const API_KEY = Deno.env.get("PAYZONE_API_KEY") || "";

    if (!MERCHANT_ID || !API_KEY) {
      throw new Error("Payzone credentials not configured");
    }

    // Prepare Payzone payment via their API
    const amountCentimes = Math.round(amount * 100);

    const successUrl = requestId
      ? `${returnUrl}?method=payzone&order_id=${orderId}&request_id=${requestId}`
      : `${returnUrl}?method=payzone&order_id=${orderId}`;

    // Payzone Payment Page API — prepare transaction
    const authHeader = "Basic " + btoa(`${MERCHANT_ID}:${API_KEY}`);

    const prepareBody = {
      apiVersion: "002.70",
      orderID: orderId,
      currency: currency,
      amount: amountCentimes,
      orderDescription: description,
      shopperName: customerName || "",
      shopperAddress: "",
      shopperZipcode: "",
      shopperCity: "",
      shopperState: "",
      shopperCountryCode: "MA",
      shopperPhone: customerPhone || "",
      shopperEmail: customerEmail,
      shopperBirthDate: "",
      ctrlRedirectURL: successUrl,
      ctrlCallbackURL: notifyUrl || "",
      ctrlCustomData: JSON.stringify({
        orderId,
        requestId: requestId || "",
        packType: packType || "",
      }),
      timeOut: "864000",
      merchantNotification: true,
      merchantNotificationTo: customerEmail,
      themeID: "",
    };

    const prepareRes = await fetch(`${PAYZONE_BASE}/transaction/prepare`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(prepareBody),
    });

    const prepareData = await prepareRes.json();

    if (!prepareData.merchantToken) {
      console.error("Payzone prepare error:", JSON.stringify(prepareData));
      throw new Error(
        prepareData.errorMessage || "Payzone: impossible de préparer le paiement"
      );
    }

    // Build payment URL
    const paymentUrl = `${PAYZONE_BASE}/payment/${prepareData.merchantToken}`;

    return new Response(
      JSON.stringify({
        paymentUrl,
        orderId,
        requestId,
        merchantToken: prepareData.merchantToken,
        expiresAt: new Date(Date.now() + 864000 * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("create-payzone-session error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
