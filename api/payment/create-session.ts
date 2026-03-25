import { db, codeCreationRequests, pricing, activityLog } from "../../src/db/index.js";
import { eq } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";

export const config = { runtime: "edge" };

const PAYZONE_BASE = "https://paiement.payzone.ma";

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return corsError("Method not allowed", 405);

  try {
    const {
      amount, description, customerName, customerEmail, customerPhone,
      packType, packCredits, offerId, offerName,
      returnUrl, cancelUrl, notifyUrl,
      currency = "MAD", language = "fr",
    } = await req.json();

    if (!amount || !customerEmail) return corsError("Missing required fields", 400);

    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderId = `EV-${ts}-${rand}`;

    // Resolve pricing offer
    let resolvedOfferId: string | null = offerId || null;
    let resolvedOfferName: string = offerName || packType || "";
    if (packType && packCredits) {
      if (offerId) {
        const [p] = await db.select().from(pricing).where(eq(pricing.id, offerId)).limit(1);
        if (p) { resolvedOfferId = p.id; resolvedOfferName = p.name; }
      }
    }

    // Insert request record first
    const [reqData] = await db.insert(codeCreationRequests).values({
      client_name: customerName || "",
      client_email: customerEmail,
      client_phone: customerPhone || null,
      offer_id: resolvedOfferId,
      offer_name: resolvedOfferName,
      credits_total: packCredits || 10,
      payment_method: "online",
      payment_status: "pending",
      request_source: "frontend",
      request_status: "pending",
      payzone_order_id: orderId,
      metadata: { description, amount, currency, language, packType },
    }).returning();

    await db.insert(activityLog).values({
      actor: "frontend",
      action: "payment_request_created",
      target_id: reqData.id,
      metadata: { payment_method: "online", packType, orderId },
    });

    // Payzone credentials
    const MERCHANT_ID = process.env.PAYZONE_MERCHANT_ID || "";
    const API_KEY = process.env.PAYZONE_API_KEY || "";
    if (!MERCHANT_ID || !API_KEY) throw new Error("Payzone credentials not configured");

    const successUrl = `${returnUrl}?method=payzone&order_id=${orderId}&request_id=${reqData.id}`;
    const authHeader = "Basic " + btoa(`${MERCHANT_ID}:${API_KEY}`);

    const prepareRes = await fetch(`${PAYZONE_BASE}/transaction/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        apiVersion: "002.70",
        orderID: orderId,
        currency,
        amount: Math.round(amount * 100),
        orderDescription: description,
        shopperName: customerName || "",
        shopperAddress: "", shopperZipcode: "", shopperCity: "", shopperState: "",
        shopperCountryCode: "MA",
        shopperPhone: customerPhone || "",
        shopperEmail: customerEmail,
        shopperBirthDate: "",
        ctrlRedirectURL: successUrl,
        ctrlCallbackURL: notifyUrl || "",
        ctrlCustomData: JSON.stringify({ orderId, requestId: reqData.id, packType: packType || "" }),
        timeOut: "864000",
        merchantNotification: true,
        merchantNotificationTo: customerEmail,
        themeID: "",
      }),
    });

    const prepareData = await prepareRes.json();
    if (!prepareData.merchantToken) throw new Error(prepareData.errorMessage || "Payzone error");

    return withCors({
      paymentUrl: `${PAYZONE_BASE}/payment/${prepareData.merchantToken}`,
      orderId,
      requestId: reqData.id,
      merchantToken: prepareData.merchantToken,
    });
  } catch (err: any) {
    return corsError(err.message);
  }
}
