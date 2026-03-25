import { db, contactSubmissions, activityLog } from "../../src/db/index.js";
import { eq, desc } from "drizzle-orm";
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
    const data = await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.created_at));
    return withCors(data);
  }

  if (req.method === "PATCH") {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return corsError("id required", 400);
      const body = await req.json();
      const [updated] = await db.update(contactSubmissions).set(body)
        .where(eq(contactSubmissions.id, id)).returning();
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
      await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));
      return withCors({ success: true });
    } catch (err: any) {
      return corsError(err.message);
    }
  }

  return corsError("Method not allowed", 405);
}
