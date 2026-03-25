import { db, packs, packUsageLog, blackcardUsage, activityLog } from "../../src/db/index.js";
import { eq } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return corsError("Method not allowed", 405);

  try {
    const body = await req.json();
    const { packCode, clientEmail, session_id, session_title, session_date, session_time, client_name, client_phone } = body;
    if (!packCode) return corsError("Code pack requis", 400);

    const [pack] = await db.select().from(packs).where(eq(packs.pack_code, packCode.toUpperCase().trim())).limit(1);
    if (!pack) return corsError("Code pack invalide", 404);

    if (!pack.is_active) return corsError("Ce code a été désactivé", 403);
    if (pack.payment_status !== "paid" && pack.payment_status !== "pay_on_site" && pack.payment_status !== "free")
      return corsError("Ce pack n'a pas encore été payé", 400);
    if (pack.expires_at && new Date(pack.expires_at) < new Date())
      return corsError("Ce pack a expiré", 400);
    const remaining = pack.credits_total - pack.credits_used;
    if (remaining <= 0) return corsError("Ce pack n'a plus de crédits disponibles", 400);

    const newUsed = pack.credits_used + 1;
    await db.update(packs).set({ credits_used: newUsed }).where(eq(packs.id, pack.id));

    await db.insert(packUsageLog).values({
      pack_id: pack.id,
      pack_code: pack.pack_code,
      session_id: session_id || null,
      session_title: session_title || null,
      session_date: session_date || null,
      session_time: session_time || null,
      used_by_name: client_name || pack.client_name,
      used_by_phone: client_phone || pack.client_phone || null,
    });

    await db.insert(blackcardUsage).values({
      blackcard_id: pack.id,
      client_id: clientEmail || null,
      client_email: clientEmail || pack.client_email || null,
      session_id: session_id || null,
    });

    await db.insert(activityLog).values({
      actor: "system",
      action: "pack_used",
      target_id: pack.id,
      metadata: { pack_code: pack.pack_code, session_id: session_id || null },
    });

    return withCors({
      success: true,
      packCode: pack.pack_code,
      creditsUsed: newUsed,
      creditsTotal: pack.credits_total,
      creditsRemaining: pack.credits_total - newUsed,
      clientName: pack.client_name,
      clientPhone: pack.client_phone,
    });
  } catch (err: any) {
    return corsError(err.message);
  }
}
