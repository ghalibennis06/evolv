import { db, adminDrinks } from "../src/db/index.js";
import { eq, asc } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "./_lib/cors.js";
import { requireAdmin } from "./_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method === "GET") {
    const data = await db.select().from(adminDrinks)
      .where(eq(adminDrinks.is_available, true))
      .orderBy(asc(adminDrinks.sort_order));
    return withCors(data);
  }

  if (req.method === "POST") {
    try {
      await requireAdmin(req);
      const body = await req.json();
      const [created] = await db.insert(adminDrinks).values(body).returning();
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
      const [updated] = await db.update(adminDrinks).set(body).where(eq(adminDrinks.id, id)).returning();
      return withCors(updated);
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  return corsError("Method not allowed", 405);
}
