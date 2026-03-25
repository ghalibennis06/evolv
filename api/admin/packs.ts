import { db, packs, packUsageLog, activityLog } from "../../src/db/index.js";
import { eq, desc, ilike, or } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";
import { requireAdmin } from "../_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    await requireAdmin(req);
  } catch {
    return corsError("Unauthorized", 401);
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    let data = await db.select().from(packs).orderBy(desc(packs.created_at)).limit(limit);

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(p =>
        p.pack_code?.toLowerCase().includes(s) ||
        p.client_name?.toLowerCase().includes(s) ||
        p.client_email?.toLowerCase().includes(s)
      );
    }
    if (status === "active") data = data.filter(p => p.is_active && p.payment_status === "paid");
    if (status === "expired") data = data.filter(p => p.expires_at && new Date(p.expires_at) < new Date());
    if (status === "pending") data = data.filter(p => p.payment_status === "pending");

    return withCors(data);
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const [created] = await db.insert(packs).values(body).returning();
      await db.insert(activityLog).values({
        actor: "admin",
        action: "pack_created_manual",
        target_id: created.id,
        metadata: { pack_code: created.pack_code, client_email: created.client_email },
      });
      return withCors(created, 201);
    } catch (err: any) {
      return corsError(err.message);
    }
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return corsError("id required", 400);
      const body = await req.json();
      const [updated] = await db.update(packs).set({ ...body, updated_at: new Date() })
        .where(eq(packs.id, id)).returning();
      await db.insert(activityLog).values({
        actor: "admin",
        action: "pack_updated",
        target_id: id,
        metadata: body,
      });
      return withCors(updated);
    } catch (err: any) {
      return corsError(err.message);
    }
  }

  if (req.method === "DELETE") {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return corsError("id required", 400);
      await db.update(packs).set({ is_active: false }).where(eq(packs.id, id));
      await db.insert(activityLog).values({
        actor: "admin", action: "pack_deactivated", target_id: id, metadata: {},
      });
      return withCors({ success: true });
    } catch (err: any) {
      return corsError(err.message);
    }
  }

  return corsError("Method not allowed", 405);
}
