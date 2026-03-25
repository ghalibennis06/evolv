import { db, products, activityLog } from "../src/db/index.js";
import { eq, asc } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "./_lib/cors.js";
import { requireAdmin } from "./_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method === "GET") {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    let query = db.select().from(products).where(eq(products.is_active, true)).orderBy(asc(products.sort_order));
    const data = await query;
    const filtered = category ? data.filter(p => p.category === category) : data;
    return withCors(filtered);
  }

  if (req.method === "POST") {
    try {
      await requireAdmin(req);
      const body = await req.json();
      const [created] = await db.insert(products).values(body).returning();
      await db.insert(activityLog).values({
        actor: "admin",
        action: "product_created",
        target_id: created.id,
        metadata: { name: created.name },
      });
      return withCors(created, 201);
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    try {
      await requireAdmin(req);
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return corsError("id required", 400);
      const body = await req.json();
      const [updated] = await db.update(products).set({ ...body, updated_at: new Date() })
        .where(eq(products.id, id)).returning();
      return withCors(updated);
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return corsError("id required", 400);
      await db.update(products).set({ is_active: false }).where(eq(products.id, id));
      return withCors({ success: true });
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  return corsError("Method not allowed", 405);
}
