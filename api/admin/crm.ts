import { db, packs, clientTags, retentionOffers, clientFollowups, reminders, activityLog } from "../../src/db/index.js";
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

  const url = new URL(req.url);
  const resource = url.searchParams.get("resource");

  if (req.method === "GET") {
    if (resource === "tags") {
      return withCors(await db.select().from(clientTags).orderBy(desc(clientTags.created_at)));
    }
    if (resource === "retention") {
      return withCors(await db.select().from(retentionOffers).orderBy(desc(retentionOffers.created_at)));
    }
    if (resource === "followups") {
      return withCors(await db.select().from(clientFollowups).orderBy(desc(clientFollowups.created_at)));
    }
    if (resource === "reminders") {
      return withCors(await db.select().from(reminders).orderBy(desc(reminders.created_at)));
    }
    // Default: return clients (unique emails from packs)
    const allPacks = await db.select().from(packs).orderBy(desc(packs.created_at));
    const clientMap = new Map<string, typeof allPacks[0][]>();
    for (const p of allPacks) {
      if (!p.client_email) continue;
      if (!clientMap.has(p.client_email)) clientMap.set(p.client_email, []);
      clientMap.get(p.client_email)!.push(p);
    }
    const clients = Array.from(clientMap.entries()).map(([email, clientPacks]) => ({
      email,
      name: clientPacks[0].client_name,
      phone: clientPacks[0].client_phone,
      packs: clientPacks,
      totalCredits: clientPacks.reduce((s, p) => s + (p.credits_total || 0), 0),
      usedCredits: clientPacks.reduce((s, p) => s + (p.credits_used || 0), 0),
      lastActivity: clientPacks[0].created_at,
    }));
    return withCors(clients);
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (resource === "tags") {
        const [r] = await db.insert(clientTags).values(body).returning();
        return withCors(r, 201);
      }
      if (resource === "retention") {
        const [r] = await db.insert(retentionOffers).values(body).returning();
        return withCors(r, 201);
      }
      if (resource === "followups") {
        const [r] = await db.insert(clientFollowups).values(body).returning();
        return withCors(r, 201);
      }
      if (resource === "reminders") {
        const [r] = await db.insert(reminders).values(body).returning();
        return withCors(r, 201);
      }
      return corsError("Unknown resource", 400);
    } catch (err: any) {
      return corsError(err.message);
    }
  }

  if (req.method === "PATCH") {
    try {
      const id = url.searchParams.get("id");
      if (!id) return corsError("id required", 400);
      const body = await req.json();
      if (resource === "followups") {
        const [r] = await db.update(clientFollowups).set(body).where(eq(clientFollowups.id, id)).returning();
        return withCors(r);
      }
      if (resource === "reminders") {
        const [r] = await db.update(reminders).set(body).where(eq(reminders.id, id)).returning();
        return withCors(r);
      }
      return corsError("Unknown resource", 400);
    } catch (err: any) {
      return corsError(err.message);
    }
  }

  return corsError("Method not allowed", 405);
}
