import { db, sessions, sessionParticipants } from "../src/db/index.js";
import { eq, gte, sql, asc } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "./_lib/cors.js";
import { requireAdmin } from "./_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  const url = new URL(req.url);

  if (req.method === "GET") {
    const fromToday = url.searchParams.get("fromToday") === "true";
    const activeOnly = url.searchParams.get("activeOnly") !== "false";
    const limit = parseInt(url.searchParams.get("limit") || "0");

    let query = db
      .select({
        id: sessions.id,
        title: sessions.title,
        date: sessions.date,
        time: sessions.time,
        duration: sessions.duration,
        capacity: sessions.capacity,
        instructor: sessions.instructor,
        level: sessions.level,
        type: sessions.type,
        price: sessions.price,
        is_active: sessions.is_active,
        notes: sessions.notes,
        created_at: sessions.created_at,
        enrolled: sql<number>`(select count(*) from session_participants where session_id = sessions.id)::int`,
      })
      .from(sessions)
      .orderBy(asc(sessions.date), asc(sessions.time)) as any;

    const conditions = [];
    if (activeOnly) conditions.push(eq(sessions.is_active, true));
    if (fromToday) conditions.push(gte(sessions.date, new Date().toISOString().split("T")[0]));

    if (conditions.length) query = query.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`);
    if (limit > 0) query = query.limit(limit);

    const data = await query;
    return withCors(data);
  }

  if (req.method === "POST") {
    try {
      await requireAdmin(req);
      const body = await req.json();
      const [created] = await db.insert(sessions).values(body).returning();
      return withCors(created, 201);
    } catch (err: any) {
      return corsError(err.message, err.message === "Unauthorized" ? 401 : 500);
    }
  }

  return corsError("Method not allowed", 405);
}
