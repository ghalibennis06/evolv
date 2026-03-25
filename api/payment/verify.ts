import { db, codeCreationRequests, packs, activityLog } from "../../src/db/index.js";
import { eq, or } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";

export const config = { runtime: "edge" };

function generatePackCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `EV-${seg(4)}-${seg(4)}`;
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return corsError("Method not allowed", 405);

  try {
    const { request_id, order_id } = await req.json();
    if (!request_id && !order_id) return corsError("request_id or order_id required", 400);

    // Find the creation request
    const condition = request_id
      ? eq(codeCreationRequests.id, request_id)
      : eq(codeCreationRequests.payzone_order_id, order_id);

    const [reqData] = await db.select().from(codeCreationRequests).where(condition).limit(1);
    if (!reqData) return corsError("Request not found", 404);

    // Already processed
    if (reqData.request_status === "auto_generated" || reqData.request_status === "completed") {
      const [existingPack] = await db.select().from(packs)
        .where(eq(packs.request_id, reqData.id)).limit(1);
      if (existingPack) {
        return withCors({
          verified: true,
          pack_code: existingPack.pack_code,
          pack_id: existingPack.id,
          already_processed: true,
        });
      }
    }

    // Generate unique pack code
    let packCode = generatePackCode();
    let attempts = 0;
    while (attempts < 10) {
      const [existing] = await db.select().from(packs).where(eq(packs.pack_code, packCode)).limit(1);
      if (!existing) break;
      packCode = generatePackCode();
      attempts++;
    }

    // Compute expiry: 12 months from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create pack
    const [newPack] = await db.insert(packs).values({
      pack_code: packCode,
      client_name: reqData.client_name,
      client_email: reqData.client_email,
      client_phone: reqData.client_phone,
      offer_id: reqData.offer_id,
      offer_name: reqData.offer_name,
      credits_total: reqData.credits_total,
      credits_used: 0,
      payment_status: "paid",
      payment_method: reqData.payment_method || "online",
      is_active: true,
      expires_at: expiresAt,
      request_id: reqData.id,
    }).returning();

    // Update request status
    await db.update(codeCreationRequests)
      .set({ request_status: "auto_generated", payment_status: "paid" })
      .where(eq(codeCreationRequests.id, reqData.id));

    await db.insert(activityLog).values({
      actor: "system",
      action: "pack_auto_generated",
      target_id: newPack.id,
      metadata: {
        pack_code: packCode,
        request_id: reqData.id,
        order_id: reqData.payzone_order_id,
        client_email: reqData.client_email,
      },
    });

    return withCors({
      verified: true,
      pack_code: packCode,
      pack_id: newPack.id,
      client_email: reqData.client_email,
      credits_total: newPack.credits_total,
    });
  } catch (err: any) {
    return corsError(err.message);
  }
}
