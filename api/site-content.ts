import { db, siteContent } from "../src/db/index.js";
import { eq } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "./_lib/cors.js";
import { requireAdmin } from "./_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  const url = new URL(req.url);
  const section = url.searchParams.get("section");

  if (req.method === "GET") {
    if (section) {
      const [row] = await db.select().from(siteContent).where(eq(siteContent.section, section)).limit(1);
      return withCors(row ?? null);
    }
    const all = await db.select().from(siteContent);
    return withCors(all);
  }

  if (req.method === "PUT" || req.method === "POST") {
    try {
      await requireAdmin(req);
      const body = await req.json();
      const { section: s, content } = body;
      const [row] = await db
        .insert(siteContent)
        .values({ section: s, content, updated_at: new Date() })
        .onConflictDoUpdate({ target: siteContent.section, set: { content, updated_at: new Date() } })
        .returning();
      return withCors(row);
    } catch (err: any) {
      return corsError(err.message, 401);
    }
  }

  return corsError("Method not allowed", 405);
}
