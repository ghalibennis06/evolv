import { db, sessions, sessionParticipants } from "../../src/db/index.js";
import { eq } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";
import { requireAdmin } from "../_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request, { params }: { params: { id: string } }) {
  if (req.method === "OPTIONS") return optionsResponse();
  const { id } = params;

  if (req.method === "GET") {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    if (!session) return corsError("Not found", 404);
    const participants = await db.select().from(sessionParticipants).where(eq(sessionParticipants.session_id, id));
    return withCors({ ...session, participants });
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    try {
      await requireAdmin(req);
      const body = await req.json();
      const [updated] = await db.update(sessions).set(body).where(eq(sessions.id, id)).returning();
      return withCors(updated);
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  if (req.method === "DELETE") {
    try {
      await requireAdmin(req);
      await db.delete(sessions).where(eq(sessions.id, id));
      return withCors({ success: true });
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  return corsError("Method not allowed", 405);
}
