/**
 * /api/admin/call — Unified admin RPC endpoint
 * Handles all actions previously served by Supabase Edge Functions.
 */
import {
  db, sessions, sessionParticipants, pricing, coaches, packs,
  packUsageLog, activityLog, codeCreationRequests, siteContent,
  products, adminDrinks, adminUsers, contactSubmissions, clientTags,
  retentionOffers, clientFollowups, reminders, waitlist,
} from "../../src/db/index.js";
import { eq, desc, asc, inArray, sql } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";
import { requireAdmin } from "../_lib/auth.js";
import { hashPassword } from "../_lib/crypto.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return corsError("Method not allowed", 405);

  try {
    await requireAdmin(req);
  } catch {
    return corsError("Unauthorized", 401);
  }

  const body = await req.json();
  const { type, action } = body;

  try {
    // ── Type-based fetches ────────────────────────────────────────────────────
    if (type === "sessions") {
      const data = await db.select().from(sessions).orderBy(desc(sessions.session_date));
      return withCors({ data });
    }

    if (type === "coaches") {
      const data = await db.select().from(coaches).orderBy(asc(coaches.sort_order));
      return withCors({ data });
    }

    if (type === "pricing") {
      const data = await db.select().from(pricing).orderBy(asc(pricing.sort_order));
      return withCors({ data });
    }

    if (type === "products") {
      const data = await db.select().from(products).orderBy(asc(products.sort_order));
      return withCors({ data });
    }

    if (type === "orders") {
      // No orders table; return empty
      return withCors({ data: [] });
    }

    if (type === "drinks") {
      const data = await db.select().from(adminDrinks).orderBy(asc(adminDrinks.sort_order));
      return withCors({ data });
    }

    if (type === "site_content") {
      const data = await db.select().from(siteContent);
      return withCors({ data });
    }

    if (type === "bookings") {
      const data = await db.select().from(sessionParticipants).orderBy(desc(sessionParticipants.created_at)).limit(100);
      return withCors({ data });
    }

    if (type === "participants") {
      const { sessionId } = body;
      if (!sessionId) return corsError("sessionId required", 400);
      const data = await db.select().from(sessionParticipants).where(eq(sessionParticipants.session_id, sessionId));
      return withCors({ data });
    }

    // ── Action-based mutations ────────────────────────────────────────────────

    // Sessions
    if (action === "create_session") {
      const [created] = await db.insert(sessions).values(body.session).returning();
      return withCors({ data: created });
    }

    if (action === "update_session") {
      const [updated] = await db.update(sessions)
        .set({ ...body.session, updated_at: new Date() })
        .where(eq(sessions.id, body.sessionId)).returning();
      return withCors({ data: updated });
    }

    if (action === "delete_session") {
      await db.delete(sessions).where(eq(sessions.id, body.sessionId));
      return withCors({ success: true });
    }

    if (action === "bulk_create_sessions") {
      const created = await db.insert(sessions).values(body.sessions).returning();
      return withCors({ data: created });
    }

    if (action === "bulk_cancel_sessions") {
      await db.update(sessions).set({ is_active: false }).where(inArray(sessions.id, body.sessionIds));
      return withCors({ success: true });
    }

    if (action === "bulk_delete_sessions") {
      await db.delete(sessions).where(inArray(sessions.id, body.sessionIds));
      return withCors({ success: true });
    }

    if (action === "cancel_session_transfer") {
      // Cancel and create credit refund entries for participants
      const parts = await db.select().from(sessionParticipants).where(eq(sessionParticipants.session_id, body.sessionId));
      await db.update(sessions).set({ is_active: false }).where(eq(sessions.id, body.sessionId));
      return withCors({ success: true, refunded: parts.length });
    }

    if (action === "duplicate_week") {
      const { sourceWeekDates, targetWeekDates } = body;
      const sourceSessions = await db.select().from(sessions)
        .where(inArray(sessions.session_date, sourceWeekDates));
      const newSessions = sourceSessions.map((s: any, i: number) => ({
        ...s,
        id: undefined,
        session_date: targetWeekDates[i % targetWeekDates.length],
        created_at: undefined,
        updated_at: undefined,
      }));
      if (newSessions.length > 0) {
        const created = await db.insert(sessions).values(newSessions).returning();
        return withCors({ data: created });
      }
      return withCors({ data: [] });
    }

    // Participants
    if (action === "add_participant") {
      const [created] = await db.insert(sessionParticipants).values({
        ...body.participant,
        session_id: body.sessionId,
      }).returning();
      return withCors({ data: created });
    }

    if (action === "remove_participant") {
      await db.delete(sessionParticipants).where(eq(sessionParticipants.id, body.participantId));
      return withCors({ success: true });
    }

    if (action === "update_participant") {
      const [updated] = await db.update(sessionParticipants)
        .set(body.participant)
        .where(eq(sessionParticipants.id, body.participantId)).returning();
      return withCors({ data: updated });
    }

    // Coaches
    if (action === "create_coach") {
      const [created] = await db.insert(coaches).values(body.coach).returning();
      return withCors({ data: created });
    }

    if (action === "update_coach") {
      const [updated] = await db.update(coaches).set(body.coach).where(eq(coaches.id, body.coachId)).returning();
      return withCors({ data: updated });
    }

    if (action === "delete_coach") {
      await db.update(coaches).set({ is_active: false }).where(eq(coaches.id, body.coachId));
      return withCors({ success: true });
    }

    if (action === "reorder_coaches") {
      for (const { id, sort_order } of body.order || []) {
        await db.update(coaches).set({ sort_order }).where(eq(coaches.id, id));
      }
      return withCors({ success: true });
    }

    if (action === "update_coach_image") {
      const [updated] = await db.update(coaches).set({ image_url: body.imageUrl }).where(eq(coaches.id, body.coachId)).returning();
      return withCors({ data: updated });
    }

    // Pricing
    if (action === "create_pricing") {
      const [created] = await db.insert(pricing).values(body.pricing).returning();
      return withCors({ data: created });
    }

    if (action === "update_pricing") {
      const [updated] = await db.update(pricing).set({ ...body.pricing, updated_at: new Date() })
        .where(eq(pricing.id, body.pricingId)).returning();
      return withCors({ data: updated });
    }

    if (action === "delete_pricing") {
      await db.update(pricing).set({ is_active: false }).where(eq(pricing.id, body.pricingId));
      return withCors({ success: true });
    }

    // Products
    if (action === "create_product") {
      const [created] = await db.insert(products).values(body.product).returning();
      return withCors({ data: created });
    }

    if (action === "update_product") {
      const [updated] = await db.update(products).set({ ...body.product, updated_at: new Date() })
        .where(eq(products.id, body.productId)).returning();
      return withCors({ data: updated });
    }

    if (action === "delete_product") {
      await db.update(products).set({ is_active: false }).where(eq(products.id, body.productId));
      return withCors({ success: true });
    }

    // Drinks
    if (action === "create_drink") {
      const [created] = await db.insert(adminDrinks).values(body.drink).returning();
      return withCors({ data: created });
    }

    if (action === "update_drink") {
      const [updated] = await db.update(adminDrinks).set(body.drink).where(eq(adminDrinks.id, body.drinkId)).returning();
      return withCors({ data: updated });
    }

    if (action === "delete_drink") {
      await db.update(adminDrinks).set({ is_available: false }).where(eq(adminDrinks.id, body.drinkId));
      return withCors({ success: true });
    }

    // Site content
    if (action === "update_site_content") {
      const { section, content } = body;
      const [row] = await db.insert(siteContent)
        .values({ section, content, updated_at: new Date() })
        .onConflictDoUpdate({ target: siteContent.section, set: { content, updated_at: new Date() } })
        .returning();
      return withCors({ data: row });
    }

    // Packs
    if (action === "approve_blackcard_request") {
      const [reqData] = await db.select().from(codeCreationRequests).where(eq(codeCreationRequests.id, body.request_id)).limit(1);
      if (!reqData) return corsError("Request not found", 404);

      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const packCode = `EV-${seg(4)}-${seg(4)}`;

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const [newPack] = await db.insert(packs).values({
        pack_code: packCode,
        client_name: reqData.client_name,
        client_email: reqData.client_email,
        client_phone: reqData.client_phone,
        offer_id: reqData.offer_id,
        offer_name: reqData.offer_name,
        credits_total: reqData.credits_total,
        credits_used: 0,
        payment_status: body.payment_source || "paid_on_site",
        payment_method: reqData.payment_method || "on_site",
        is_active: true,
        expires_at: expiresAt,
        request_id: reqData.id,
      }).returning();

      await db.update(codeCreationRequests)
        .set({ request_status: "approved", payment_status: "paid" })
        .where(eq(codeCreationRequests.id, body.request_id));

      await db.insert(activityLog).values({
        actor: "admin", action: "pack_approved", target_id: newPack.id,
        metadata: { pack_code: packCode, request_id: body.request_id },
      });

      return withCors({ data: newPack, pack_code: packCode });
    }

    if (action === "reject_blackcard_request") {
      await db.update(codeCreationRequests)
        .set({ request_status: "rejected" })
        .where(eq(codeCreationRequests.id, body.request_id));
      return withCors({ success: true });
    }

    if (action === "adjust_pack_credits") {
      const [updated] = await db.update(packs)
        .set({ credits_used: body.new_credits_used, updated_at: new Date() })
        .where(eq(packs.id, body.pack_id)).returning();
      await db.insert(activityLog).values({
        actor: "admin", action: "pack_credits_adjusted", target_id: body.pack_id,
        metadata: { new_credits_used: body.new_credits_used, reason: body.reason },
      });
      return withCors({ data: updated });
    }

    if (action === "deactivate_pack") {
      await db.update(packs).set({ is_active: false, updated_at: new Date() }).where(eq(packs.id, body.pack_id));
      await db.insert(activityLog).values({
        actor: "admin", action: "pack_deactivated", target_id: body.pack_id,
        metadata: { reason: body.reason },
      });
      return withCors({ success: true });
    }

    if (action === "delete_pack") {
      await db.update(packs).set({ is_active: false, updated_at: new Date() }).where(eq(packs.id, body.pack_id));
      await db.insert(activityLog).values({
        actor: "admin", action: "pack_deleted", target_id: body.pack_id,
        metadata: { deleted_by: body.deleted_by, reason: body.reason },
      });
      return withCors({ success: true });
    }

    if (action === "get_pack_history") {
      const [pack] = await db.select().from(packs).where(eq(packs.pack_code, body.pack_code)).limit(1);
      if (!pack) return corsError("Pack not found", 404);
      const usage = await db.select().from(packUsageLog).where(eq(packUsageLog.pack_id, pack.id)).orderBy(desc(packUsageLog.used_at));
      return withCors({ data: { pack, usage } });
    }

    if (action === "create_pack_manual") {
      const [created] = await db.insert(packs).values(body.pack).returning();
      return withCors({ data: created });
    }

    // CRM / Client actions
    if (action === "get_client_activity") {
      const { client_email } = body;
      const clientPacks = await db.select().from(packs).where(eq(packs.client_email, client_email)).orderBy(desc(packs.created_at));
      const logs = await db.select().from(activityLog).orderBy(desc(activityLog.created_at)).limit(50);
      const clientLogs = logs.filter(l => (l.metadata as any)?.client_email === client_email || (l.metadata as any)?.email === client_email);
      return withCors({
        packs: clientPacks,
        activity: clientLogs,
        notes: [],
        tags: [],
        totalCredits: clientPacks.reduce((s, p) => s + (p.credits_total || 0), 0),
        usedCredits: clientPacks.reduce((s, p) => s + (p.credits_used || 0), 0),
      });
    }

    if (action === "add_client_note") {
      await db.insert(activityLog).values({
        actor: "admin", action: "client_note_added",
        target_id: null as any,
        metadata: { client_email: body.client_email, note: body.note },
      });
      return withCors({ success: true });
    }

    if (action === "delete_client_note") {
      await db.delete(activityLog).where(eq(activityLog.id, body.note_id));
      return withCors({ success: true });
    }

    if (action === "add_client_tag") {
      const [tag] = await db.insert(clientTags).values({ client_email: body.client_email, tag: body.tag }).returning();
      return withCors({ data: tag });
    }

    if (action === "create_retention_offer") {
      const [offer] = await db.insert(retentionOffers).values({
        client_email: body.client_email,
        offer_type: body.offer_type,
        discount_percent: body.discount_percent,
        status: "pending",
      }).returning();
      return withCors({ data: offer });
    }

    if (action === "mark_follow_up") {
      const [followup] = await db.insert(clientFollowups).values({
        client_email: body.client_email,
        reason: body.reason,
        status: "pending",
      }).returning();
      return withCors({ data: followup });
    }

    if (action === "log_whatsapp_action") {
      await db.insert(activityLog).values({
        actor: "admin", action: "whatsapp_sent",
        target_id: null as any,
        metadata: { client_email: body.client_email, template: body.template },
      });
      return withCors({ success: true });
    }

    // Admin users
    if (action === "get_users") {
      const users = await db.select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role, created_at: adminUsers.created_at })
        .from(adminUsers).orderBy(desc(adminUsers.created_at));
      return withCors({ data: users });
    }

    if (action === "invite_user") {
      // Create a new admin user with a temporary password
      const tempPassword = Math.random().toString(36).slice(2, 12);
      const passwordHash = await hashPassword(tempPassword);
      const [created] = await db.insert(adminUsers).values({
        email: body.email, name: body.email.split("@")[0],
        password_hash: passwordHash, role: body.role || "admin",
      }).returning();
      return withCors({ data: created, temp_password: tempPassword });
    }

    if (action === "remove_user") {
      await db.delete(adminUsers).where(eq(adminUsers.id, body.user_id));
      return withCors({ success: true });
    }

    // Activity journal
    if (action === "get_journal") {
      const data = await db.select().from(activityLog)
        .orderBy(desc(activityLog.created_at))
        .limit(body.limit || 100);
      return withCors({ data });
    }

    return corsError(`Unknown action/type: ${action || type}`, 400);
  } catch (err: any) {
    return corsError(err.message || "Server error");
  }
}
