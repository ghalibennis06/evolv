import { db, waitlist, activityLog } from "../src/db/index.js";
import { eq } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "./_lib/cors.js";
import { requireAdmin } from "./_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method === "POST") {
    try {
      const { name, email, phone, session_id, session_title, notes } = await req.json();
      if (!name || !email) return corsError("name and email required", 400);

      const [entry] = await db.insert(waitlist).values({
        name, email, phone: phone || null,
        session_id: session_id || null,
        session_title: session_title || null,
        notes: notes || null,
      }).returning();

      await db.insert(activityLog).values({
        actor: "frontend",
        action: "waitlist_joined",
        target_id: entry.id,
        metadata: { email, session_id: session_id || null },
      });

      return withCors({ success: true, id: entry.id });
    } catch (err: any) {
      return corsError(err.message);
    }
  }

  if (req.method === "GET") {
    try {
      await requireAdmin(req);
      const entries = await db.select().from(waitlist);
      return withCors(entries);
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  return corsError("Method not allowed", 405);
}
