import { db, packs, sessions, codeCreationRequests, contactSubmissions, activityLog, waitlist } from "../../src/db/index.js";
import { eq, gte, sql, desc } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";
import { requireAdmin } from "../_lib/auth.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "GET") return corsError("Method not allowed", 405);

  try {
    await requireAdmin(req);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      allPacks,
      upcomingSessions,
      recentRequests,
      recentContacts,
      recentActivity,
      waitlistEntries,
    ] = await Promise.all([
      db.select().from(packs).where(eq(packs.is_active, true)),
      db.select().from(sessions).where(gte(sessions.session_date, new Date().toISOString().split("T")[0])),
      db.select().from(codeCreationRequests)
        .orderBy(desc(codeCreationRequests.created_at)).limit(20),
      db.select().from(contactSubmissions)
        .orderBy(desc(contactSubmissions.created_at)).limit(10),
      db.select().from(activityLog)
        .orderBy(desc(activityLog.created_at)).limit(50),
      db.select().from(waitlist).orderBy(desc(waitlist.created_at)).limit(20),
    ]);

    const totalRevenue = recentRequests
      .filter(r => r.payment_status === "paid")
      .reduce((sum, r) => {
        const amount = (r.metadata as any)?.amount || 0;
        return sum + Number(amount);
      }, 0);

    const activePacksCount = allPacks.length;
    const totalCreditsUsed = allPacks.reduce((s, p) => s + (p.credits_used || 0), 0);
    const totalCreditsAvailable = allPacks.reduce((s, p) => s + ((p.credits_total || 0) - (p.credits_used || 0)), 0);

    return withCors({
      stats: {
        activePacks: activePacksCount,
        upcomingSessionsCount: upcomingSessions.length,
        totalCreditsUsed,
        totalCreditsAvailable,
        totalRevenue,
        pendingRequests: recentRequests.filter(r => r.request_status === "pending").length,
      },
      recentRequests,
      recentContacts,
      recentActivity,
      upcomingSessions,
      waitlist: waitlistEntries,
    });
  } catch (err: any) {
    return corsError(err.message, 401);
  }
}
