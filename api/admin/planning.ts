import { db, sessions, sessionParticipants, activityLog } from "../../src/db/index.js";
import { eq, gte, lte, and, desc } from "drizzle-orm";
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
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const sessionId = url.searchParams.get("session_id");

    if (sessionId) {
      const participants = await db.select().from(sessionParticipants)
        .where(eq(sessionParticipants.session_id, sessionId));
      return withCors(participants);
    }

    let data = await db.select().from(sessions).orderBy(desc(sessions.session_date));
    if (from) data = data.filter(s => s.session_date >= from);
    if (to) data = data.filter(s => s.session_date <= to);
    return withCors(data);
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const [created] = await db.insert(sessions).values(body).returning();
      await db.insert(activityLog).values({
        actor: "admin",
        action: "session_created",
        target_id: created.id,
        metadata: { title: created.title, date: created.session_date },
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
      const [updated] = await db.update(sessions).set({ ...body, updated_at: new Date() })
        .where(eq(sessions.id, id)).returning();
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
      await db.delete(sessions).where(eq(sessions.id, id));
      await db.insert(activityLog).values({
        actor: "admin", action: "session_deleted", target_id: id, metadata: {},
      });
      return withCors({ success: true });
    } catch (err: any) {
      return corsError(err.message);
    }
  }

  return corsError("Method not allowed", 405);
}
