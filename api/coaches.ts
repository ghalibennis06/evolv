import { db, coaches } from "../src/db/index.js";
import { eq, asc } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "./_lib/cors.js";
import { requireAdmin } from "./_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method === "GET") {
    const data = await db.select().from(coaches).where(eq(coaches.is_active, true)).orderBy(asc(coaches.sort_order));
    return withCors(data);
  }

  if (req.method === "POST") {
    try {
      await requireAdmin(req);
      const body = await req.json();
      const [created] = await db.insert(coaches).values(body).returning();
      return withCors(created, 201);
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  return corsError("Method not allowed", 405);
}
