import { db, pricing } from "../src/db/index.js";
import { eq, asc } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "./_lib/cors.js";
import { requireAdmin } from "./_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method === "GET") {
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("activeOnly") !== "false";
    const query = db.select().from(pricing).orderBy(asc(pricing.sort_order)) as any;
    const data = await (activeOnly ? query.where(eq(pricing.is_active, true)) : query);
    return withCors(data);
  }

  if (req.method === "POST") {
    try {
      await requireAdmin(req);
      const body = await req.json();
      const [created] = await db.insert(pricing).values(body).returning();
      return withCors(created, 201);
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  return corsError("Method not allowed", 405);
}
