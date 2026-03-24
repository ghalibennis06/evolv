import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_PASSWORD = "thecircle2024";
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const seg = (n: number) => Array.from({ length: n }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join("");
const generateBlackCardCode = () => `TC-${seg(4)}-${seg(4)}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { password, type, action, ...params } = body;

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const json = (data: any) =>
      new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const logJournal = async (actionType: string, actionBy: string, details: any) => {
      await supabase.from("admin_journal").insert({
        action_type: actionType,
        action_by: actionBy,
        details,
      });
    };

    const logActivity = async (actor: string, actionType: string, targetId: string | null, metadata: any) => {
      await supabase.from("activity_log").insert({
        actor,
        action: actionType,
        target_id: targetId,
        metadata: metadata || {},
      });
    };

    // ═══════════════════════════════════════════════════════════
    // DATA FETCHERS (type-based)
    // ═══════════════════════════════════════════════════════════

    if (type === "dashboard_stats") {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const monStr = monday.toISOString().split("T")[0];
      const sunStr = sunday.toISOString().split("T")[0];

      // Date ranges
      const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
      const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
      const d90 = new Date(now); d90.setDate(d90.getDate() - 90);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { startDate, endDate, coach: coachFilter, classType: classTypeFilter, segment = "all" } = params;
      const periodStartIso = startDate ? new Date(String(startDate)).toISOString() : monday.toISOString();
      const periodEndIso = endDate ? new Date(String(endDate)).toISOString() : sunday.toISOString();

      const [sessRes, packsRes, bookingsAllRes, packUsageRes, ordersRes, participantsRes, coachesRes, productsRes] = await Promise.all([
        supabase.from("sessions").select("id, title, capacity, date, price, instructor, type, time").gte("date", startDate ? String(startDate).split("T")[0] : monStr).lte("date", endDate ? String(endDate).split("T")[0] : sunStr).eq("is_active", true),
        supabase.from("packs").select("id, credits_total, credits_used, pack_type, payment_status, created_at").eq("is_active", true),
        supabase.from("bookings").select("id, client_email, client_name, created_at, status, class_name, coach").order("created_at", { ascending: false }),
        supabase.from("pack_usage_log").select("id, used_at, cancelled_at").gte("used_at", monday.toISOString()),
        supabase.from("orders").select("id, total_amount, created_at, payment_status"),
        supabase.from("session_participants").select("id, session_id, email, registered_at, payment_status"),
        supabase.from("coaches").select("name").eq("is_active", true),
        supabase.from("products").select("id, name"),
      ]);

      const sessions = sessRes.data || [];
      const allBookings = bookingsAllRes.data || [];
      const allParticipants = participantsRes.data || [];
      const allOrders = ordersRes.data || [];
      const packUsage = packUsageRes.data || [];
      const packs = packsRes.data || [];
      const products = productsRes.data || [];

      const firstBookingByEmail = new Map<string, string>();
      for (const b of [...allBookings].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""))) {
        const email = b.client_email?.toLowerCase().trim();
        if (!email || firstBookingByEmail.has(email)) continue;
        firstBookingByEmail.set(email, b.created_at);
      }

      const bySegment = (emailRaw?: string | null) => {
        if (segment === "all") return true;
        const email = emailRaw?.toLowerCase().trim();
        if (!email) return segment !== "acquisition";
        const firstSeen = firstBookingByEmail.get(email);
        if (!firstSeen) return segment !== "acquisition";
        if (segment === "acquisition") return firstSeen >= periodStartIso && firstSeen <= periodEndIso;
        if (segment === "retention") return firstSeen < periodStartIso;
        return true;
      };

      const filteredSessions = sessions.filter((s) => (!coachFilter || s.instructor === coachFilter) && (!classTypeFilter || s.type === classTypeFilter));
      const filteredSessionIds = new Set(filteredSessions.map((s) => s.id));
      const filteredParticipants = allParticipants.filter((p) => filteredSessionIds.has(p.session_id) && bySegment(p.email));
      const filteredBookings = allBookings.filter((b) => (!coachFilter || b.coach === coachFilter) && (!classTypeFilter || b.class_name === classTypeFilter || b.class_type === classTypeFilter) && bySegment(b.client_email));

      // Week sessions capacity & enrollment
      const totalCapacity = filteredSessions.reduce((s, x) => s + (x.capacity || 0), 0);
      const weekParticipants = filteredParticipants;
      const totalEnrolled = weekParticipants.length;

      // Bookings today & week
      const bookingsToday = filteredBookings.filter(b => b.created_at?.startsWith(todayStr)).length;
      const weekBookings = filteredBookings.filter(b => b.created_at >= monday.toISOString()).length;

      // Revenue: from sessions (price * enrolled) for the week + orders
      const sessionRevenueMap: Record<string, number> = {};
      for (const s of filteredSessions) { sessionRevenueMap[s.id] = s.price || 350; }
      const weekSessionRevenue = weekParticipants.reduce((sum, p) => {
        const price = sessionRevenueMap[p.session_id] || 350;
        return sum + (["Payé", "paid", "pack"].includes(p.payment_status) ? price : 0);
      }, 0);

      const todaySessions = filteredSessions.filter(s => s.date === todayStr);
      const todaySessionIds = new Set(todaySessions.map(s => s.id));
      const todayParticipants = allParticipants.filter(p => todaySessionIds.has(p.session_id));
      const todaySessionRevenue = todayParticipants.reduce((sum, p) => {
        const price = sessionRevenueMap[p.session_id] || 350;
        return sum + (["Payé", "paid", "pack"].includes(p.payment_status) ? price : 0);
      }, 0);

      const weekOrders = allOrders.filter(o => o.created_at >= monday.toISOString() && (o.payment_status === "paid" || o.payment_status === "Payé"));
      const todayOrders = weekOrders.filter(o => o.created_at?.startsWith(todayStr));
      const revenueToday = todaySessionRevenue + todayOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
      const revenueWeek = weekSessionRevenue + weekOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
      const monthOrders = allOrders.filter(o => o.created_at >= monthStart && (o.payment_status === "paid" || o.payment_status === "Payé"));
      const revenueMonth = monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const shopSales = monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const blackCardSales = (packsRes.data || []).filter((p: any) =>
        (p.pack_type || "") === "carte_black" &&
        (p.payment_status === "paid" || p.payment_status === "Payé") &&
        p.created_at >= periodStartIso &&
        p.created_at <= periodEndIso,
      ).length;

      // Pack usage this week
      const packUsageWeek = packUsage.filter(p => !p.cancelled_at).length;

      // No-show rate (participants with status "absent" / total)
      const absentCount = filteredParticipants.filter(p => p.payment_status === "absent" || p.payment_status === "no-show").length;
      const cancelledCount = filteredBookings.filter((b) => (b.status || "").toLowerCase().includes("cancel")).length;
      const noShowRate = filteredParticipants.length > 0 ? Math.round((absentCount / filteredParticipants.length) * 100) : 0;

      // Client segmentation
      const clientMap = new Map<string, { firstSeen: string; lastSeen: string; count: number; name: string }>();
      for (const b of filteredBookings) {
        const key = b.client_email?.toLowerCase().trim();
        if (!key) continue;
        const ex = clientMap.get(key);
        if (!ex) clientMap.set(key, { firstSeen: b.created_at, lastSeen: b.created_at, count: 1, name: b.client_name });
        else {
          ex.count++;
          if (b.created_at > ex.lastSeen) { ex.lastSeen = b.created_at; ex.name = b.client_name; }
          if (b.created_at < ex.firstSeen) ex.firstSeen = b.created_at;
        }
      }
      for (const p of filteredParticipants) {
        const key = p.email?.toLowerCase().trim();
        if (!key) continue;
        const ex = clientMap.get(key);
        if (!ex) clientMap.set(key, { firstSeen: p.registered_at, lastSeen: p.registered_at, count: 1, name: key });
        else {
          ex.count++;
          if (p.registered_at > ex.lastSeen) ex.lastSeen = p.registered_at;
          if (p.registered_at < ex.firstSeen) ex.firstSeen = p.registered_at;
        }
      }

      const d30Str = d30.toISOString();
      const d60Str = d60.toISOString();
      const d90Str = d90.toISOString();
      let activeClients = 0, newClients = 0, returningClients = 0;
      const churnRisk: Array<{ email: string; name: string; lastSeen: string; daysSince: number }> = [];

      for (const [email, c] of clientMap) {
        if (c.lastSeen >= d30Str) {
          activeClients++;
          if (c.firstSeen >= d30Str) newClients++;
          else if (c.count >= 2) returningClients++;
        } else if (c.lastSeen >= d90Str) {
          const daysSince = Math.round((now.getTime() - new Date(c.lastSeen).getTime()) / 86400000);
          churnRisk.push({ email, name: c.name, lastSeen: c.lastSeen, daysSince });
        }
      }
      churnRisk.sort((a, b) => a.daysSince - b.daysSince);

      // Daily bookings for mini-chart (last 7 days)
      const dailyBookings: Array<{ date: string; count: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        const count = filteredBookings.filter(b => b.created_at?.startsWith(ds)).length;
        dailyBookings.push({ date: ds, count });
      }

      // Coaches list for filters
      const validCoachNames = new Set((coachesRes.data || []).map((c:any) => c.name));
      const coachSet = new Set(filteredSessions.map(s => s.instructor).filter((n:any) => !!n && validCoachNames.has(n)));
      const typeSet = new Set(filteredSessions.map(s => s.type).filter(Boolean));

      const revenueByCoachMap: Record<string, number> = {};
      const revenueByClassTypeMap: Record<string, number> = {};
      for (const s of filteredSessions) {
        const sid = s.id;
        const paidCount = filteredParticipants.filter((p) => p.session_id === sid && ["Payé", "paid", "pack"].includes(p.payment_status)).length;
        const rev = paidCount * (s.price || 350);
        revenueByCoachMap[s.instructor || "Inconnu"] = (revenueByCoachMap[s.instructor || "Inconnu"] || 0) + rev;
        revenueByClassTypeMap[s.type || "Autre"] = (revenueByClassTypeMap[s.type || "Autre"] || 0) + rev;
      }

      const revenueByCoach = Object.entries(revenueByCoachMap).map(([coach, revenue]) => ({ coach, revenue })).sort((a,b)=>b.revenue-a.revenue);
      const revenueByClassType = Object.entries(revenueByClassTypeMap).map(([classType, revenue]) => ({ classType, revenue })).sort((a,b)=>b.revenue-a.revenue);

      const participantsBySession = new Map<string, number>();
      for (const p of filteredParticipants) {
        participantsBySession.set(p.session_id, (participantsBySession.get(p.session_id) || 0) + 1);
      }
      const underperformingSessions = filteredSessions
        .map((s) => {
          const enrolled = participantsBySession.get(s.id) || 0;
          const fillRate = s.capacity > 0 ? Math.round((enrolled / s.capacity) * 100) : 0;
          return {
            id: s.id,
            title: s.title || s.type || "Séance",
            date: s.date,
            time: s.time,
            instructor: s.instructor || "-",
            enrolled,
            capacity: s.capacity || 0,
            fillRate,
          };
        })
        .filter((s) => s.fillRate <= 40)
        .sort((a, b) => a.fillRate - b.fillRate)
        .slice(0, 8);

      const productNameById = new Map(products.map((p: any) => [p.id, p.name]));
      const paidOrdersInPeriod = allOrders.filter(
        (o) =>
          (o.payment_status === "paid" || o.payment_status === "Payé") &&
          o.created_at >= periodStartIso &&
          o.created_at <= periodEndIso,
      );
      const bestOfferMap: Record<string, { label: string; sales: number; revenue: number; type: string }> = {};
      for (const o of paidOrdersInPeriod) {
        const label = productNameById.get(o.product_id) || "Boutique";
        if (!bestOfferMap[label]) bestOfferMap[label] = { label, sales: 0, revenue: 0, type: "shop" };
        bestOfferMap[label].sales += o.quantity || 1;
        bestOfferMap[label].revenue += o.total_amount || 0;
      }
      for (const p of packs.filter((p: any) => p.created_at >= periodStartIso && p.created_at <= periodEndIso)) {
        const label = p.pack_type === "carte_black" ? "Carte Black" : p.pack_type || "Pack";
        if (!bestOfferMap[label]) bestOfferMap[label] = { label, sales: 0, revenue: 0, type: "pack" };
        bestOfferMap[label].sales += 1;
      }
      const bestSellingOffers = Object.values(bestOfferMap)
        .sort((a, b) => b.sales - a.sales || b.revenue - a.revenue)
        .slice(0, 8);

      return json({
        totalSessions: filteredSessions.length,
        totalCapacity,
        totalEnrolled,
        fillRate: totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0,
        weekBookings,
        bookingsToday,
        activePacks: packs.length,
        revenueToday,
        revenueWeek,
        revenueMonth,
        packUsageWeek,
        noShowRate,
        cancelledCount,
        activeClients,
        newClients,
        returningClients,
        blackCardSales,
        shopSales,
        churnRisk: churnRisk.slice(0, 20),
        totalClients: clientMap.size,
        dailyBookings,
        coaches: [...coachSet],
        classTypes: [...typeSet],
        revenueByCoach,
        revenueByClassType,
        underperformingSessions,
        bestSellingOffers,
      });
    }

    if (type === "bookings") {
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return json(data);
    }

    if (type === "sessions") {
      const { data: sessions, error } = await supabase.from("sessions").select("*").order("date").order("time");
      if (error) throw error;
      // Add enrolled count
      const enriched = await Promise.all(
        (sessions || []).map(async (s) => {
          const { count } = await supabase.from("session_participants").select("*", { count: "exact", head: true }).eq("session_id", s.id);
          return { ...s, enrolled: count || 0 };
        })
      );
      return json(enriched);
    }

    if (type === "coaches") {
      const { data, error } = await supabase.from("coaches").select("*").order("sort_order");
      if (error) throw error;
      return json(data);
    }

    if (type === "participants") {
      const { sessionId } = params;
      const { data, error } = await supabase.from("session_participants").select("*").eq("session_id", sessionId).order("registered_at");
      if (error) throw error;
      return json(data);
    }

    if (type === "site_content") {
      const { data, error } = await supabase.from("site_content").select("*");
      if (error) throw error;
      return json(data);
    }

    if (type === "packs") {
      const { data, error } = await supabase.from("packs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return json(data);
    }

    if (type === "blackcard_requests") {
      const { data, error } = await supabase
        .from("code_creation_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(data);
    }

    if (type === "pricing") {
      const { data, error } = await supabase.from("pricing").select("*").order("sort_order");
      if (error) throw error;
      return json(data);
    }

    if (type === "products") {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return json(data);
    }

    if (type === "orders") {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return json(data);
    }

    if (type === "drinks") {
      const { data, error } = await supabase.from("admin_drinks").select("*").order("sort_order");
      if (error) throw error;
      return json(data);
    }

    // ═══════════════════════════════════════════════════════════
    // ACTION HANDLERS
    // ═══════════════════════════════════════════════════════════

    // ── SESSIONS ──
    if (action === "create_session") {
      const { session } = params;
      const { data, error } = await supabase.from("sessions").insert(session).select().single();
      if (error) throw error;
      await logJournal("create_session", "admin", { session_id: data.id, title: session.title });
      return json(data);
    }

    if (action === "update_session") {
      const { sessionId, session } = params;
      const { data, error } = await supabase.from("sessions").update(session).eq("id", sessionId).select().single();
      if (error) throw error;
      return json(data);
    }

    // Cancel session AND move all participants to waitlist with their payment status
    if (action === "cancel_session_transfer") {
      const { sessionId } = params;

      // 1. Get session details
      const { data: session, error: sessErr } = await supabase.from("sessions").select("*").eq("id", sessionId).single();
      if (sessErr) throw sessErr;

      // 2. Get all participants
      const { data: participants, error: partErr } = await supabase.from("session_participants").select("*").eq("session_id", sessionId);
      if (partErr) throw partErr;

      // 3. Move each participant to waitlist with their payment info
      const transferred = [];
      for (const p of (participants || [])) {
        const waitlistEntry = {
          client_name: `${p.first_name} ${p.last_name}`.trim(),
          client_email: p.email,
          client_phone: p.phone || null,
          class_name: session.title,
          class_day: session.date,
          class_time: session.time,
          coach: session.instructor,
          status: "pending",
          payment_status: p.payment_status || "En attente",
          original_session_id: sessionId,
          notes: `Transféré depuis session annulée du ${session.date} à ${session.time}`,
        };
        const { error: wlErr } = await supabase.from("waitlist").insert(waitlistEntry);
        if (!wlErr) transferred.push({ name: waitlistEntry.client_name, phone: p.phone, payment_status: p.payment_status });
      }

      // 4. Mark session as cancelled
      await supabase.from("sessions").update({ is_active: false }).eq("id", sessionId);

      await logJournal("cancel_session_transfer", "admin", {
        session_id: sessionId,
        title: session.title,
        date: session.date,
        time: session.time,
        transferred_count: transferred.length,
      });

      return json({ success: true, transferred, session: { title: session.title, date: session.date, time: session.time } });
    }

    if (action === "delete_session") {
      const { sessionId } = params;
      const { data: sess, error: sessErr } = await supabase.from("sessions").select("*").eq("id", sessionId).single();
      if (sessErr) throw sessErr;
      const { data: parts, error: partsErr } = await supabase.from("session_participants").select("*").eq("session_id", sessionId);
      if (partsErr) throw partsErr;

      if (parts && parts.length > 0) {
        const waitlistEntries = parts.map((p) => ({
          client_name: `${p.first_name} ${p.last_name}`.trim(),
          client_email: p.email,
          client_phone: p.phone || null,
          class_name: sess.title,
          class_day: sess.date,
          class_time: sess.time,
          coach: sess.instructor,
          status: "pending",
          payment_status: p.payment_status || "En attente",
          original_session_id: sessionId,
          notes: `Transféré depuis suppression session du ${sess.date} à ${sess.time}`,
        }));
        const { error: wlErr } = await supabase.from("waitlist").insert(waitlistEntries);
        if (wlErr) throw wlErr;
      }

      await supabase.from("session_participants").delete().eq("session_id", sessionId);
      const { error } = await supabase.from("sessions").update({ is_active: false }).eq("id", sessionId);
      if (error) throw error;
      await logJournal("delete_session", "admin", { session_id: sessionId, transferred: (parts || []).length });
      return json({ success: true, transferred: (parts || []).length });
    }

    if (action === "bulk_create_sessions") {
      const { sessions } = params;
      const { data, error } = await supabase.from("sessions").insert(sessions).select();
      if (error) throw error;
      await logJournal("bulk_create_sessions", "admin", { count: (data || []).length });
      return json({ success: true, count: (data || []).length });
    }

    if (action === "bulk_cancel_sessions") {
      const { sessionIds } = params;
      if (!Array.isArray(sessionIds)) throw new Error("sessionIds must be an array");
      let totalTransferred = 0;

      for (const sid of sessionIds) {
        // Get session + participants
        const { data: sess } = await supabase.from("sessions").select("*").eq("id", sid).single();
        const { data: parts } = await supabase.from("session_participants").select("*").eq("session_id", sid);
        if (sess && parts && parts.length > 0) {
          const waitlistEntries = parts.map(p => ({
            client_name: `${p.first_name} ${p.last_name}`.trim(),
            client_email: p.email,
            client_phone: p.phone || null,
            class_name: sess.title,
            class_day: sess.date,
            class_time: sess.time,
            coach: sess.instructor,
            status: "pending",
            payment_status: p.payment_status || "En attente",
            original_session_id: sid,
            notes: `Transféré depuis session annulée du ${sess.date} à ${sess.time}`,
          }));
          await supabase.from("waitlist").insert(waitlistEntries);
          totalTransferred += parts.length;
        }
      }

      const { error } = await supabase.from("sessions").update({ is_active: false }).in("id", sessionIds);
      if (error) throw error;
      await logJournal("bulk_cancel_sessions", "admin", { count: sessionIds.length, transferred: totalTransferred });
      return json({ success: true, count: sessionIds.length, transferred: totalTransferred });
    }

    if (action === "bulk_delete_sessions") {
      const { sessionIds } = params;
      if (!Array.isArray(sessionIds)) throw new Error("sessionIds must be an array");
      let totalTransferred = 0;
      for (const sid of sessionIds) {
        const { data: sess } = await supabase.from("sessions").select("*").eq("id", sid).single();
        const { data: parts } = await supabase.from("session_participants").select("*").eq("session_id", sid);
        if (sess && parts && parts.length > 0) {
          const waitlistEntries = parts.map((p) => ({
            client_name: `${p.first_name} ${p.last_name}`.trim(),
            client_email: p.email,
            client_phone: p.phone || null,
            class_name: sess.title,
            class_day: sess.date,
            class_time: sess.time,
            coach: sess.instructor,
            status: "pending",
            payment_status: p.payment_status || "En attente",
            original_session_id: sid,
            notes: `Transféré depuis suppression session du ${sess.date} à ${sess.time}`,
          }));
          await supabase.from("waitlist").insert(waitlistEntries);
          totalTransferred += parts.length;
        }
        await supabase.from("session_participants").delete().eq("session_id", sid);
      }
      const { error } = await supabase.from("sessions").update({ is_active: false }).in("id", sessionIds);
      if (error) throw error;
      await logJournal("bulk_delete_sessions", "admin", { count: sessionIds.length, transferred: totalTransferred });
      return json({ success: true, count: sessionIds.length, transferred: totalTransferred });
    }

    if (action === "duplicate_week") {
      const { sourceWeekDates, targetWeekDates } = params;
      if (!Array.isArray(sourceWeekDates) || !Array.isArray(targetWeekDates) || sourceWeekDates.length !== 7 || targetWeekDates.length !== 7)
        throw new Error("sourceWeekDates and targetWeekDates must be 7-element arrays");
      const { data: sourceSessions, error: fetchErr } = await supabase.from("sessions").select("*").in("date", sourceWeekDates).eq("is_active", true);
      if (fetchErr) throw fetchErr;
      if (!sourceSessions?.length) return json({ success: true, count: 0 });
      const dateMap: Record<string, string> = {};
      for (let i = 0; i < 7; i++) dateMap[sourceWeekDates[i]] = targetWeekDates[i];
      const newSessions = sourceSessions.map(s => {
        const { id, created_at, ...rest } = s;
        return { ...rest, date: dateMap[s.date] || s.date };
      });
      const { data, error } = await supabase.from("sessions").insert(newSessions).select();
      if (error) throw error;
      await logJournal("duplicate_week", "admin", { from: sourceWeekDates[0], to: targetWeekDates[0], count: (data || []).length });
      return json({ success: true, count: (data || []).length });
    }

    // ── PARTICIPANTS ──
    if (action === "add_participant") {
      const { participant, waitlistId } = params;

      const { data: existing } = await supabase
        .from("session_participants")
        .select("id")
        .eq("session_id", participant.session_id)
        .eq("email", participant.email)
        .maybeSingle();
      if (existing) throw new Error("Ce participant est déjà inscrit à cette session");

      const { data, error } = await supabase.from("session_participants").insert(participant).select().single();
      if (error) throw error;

      if (waitlistId) {
        await supabase.from("waitlist").delete().eq("id", waitlistId);
      }

      return json(data);
    }

    if (action === "remove_participant") {
      const { participantId } = params;
      const { error } = await supabase.from("session_participants").delete().eq("id", participantId);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "update_participant") {
      const { participantId, participant } = params;
      const { data, error } = await supabase.from("session_participants").update(participant).eq("id", participantId).select().single();
      if (error) throw error;
      return json(data);
    }

    // ── COACHES ──
    if (action === "create_coach") {
      const { coach } = params;
      const { data, error } = await supabase.from("coaches").insert(coach).select().single();
      if (error) throw error;
      await logJournal("create_coach", "admin", { coach_id: data.id, name: coach.name });
      return json(data);
    }

    if (action === "update_coach") {
      const { coachId, coach } = params;
      const { data, error } = await supabase.from("coaches").update(coach).eq("id", coachId).select().single();
      if (error) throw error;
      return json(data);
    }

    if (action === "delete_coach") {
      const { coachId } = params;
      const { error } = await supabase.from("coaches").delete().eq("id", coachId);
      if (error) throw error;
      await logJournal("delete_coach", "admin", { coach_id: coachId });
      return json({ success: true });
    }

    if (action === "reorder_coaches") {
      const { orderedIds } = params;
      if (!Array.isArray(orderedIds)) throw new Error("orderedIds must be an array");
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase.from("coaches").update({ sort_order: i }).eq("id", orderedIds[i]);
        if (error) throw error;
      }
      await logJournal("reorder_coaches", "admin", { count: orderedIds.length });
      return json({ success: true });
    }

    if (action === "toggle_featured_coach") {
      const { coachId, featured_coach } = params;
      const { error } = await supabase.from("coaches").update({ featured_coach }).eq("id", coachId);
      if (error) throw error;
      await logJournal("toggle_featured_coach", "admin", { coach_id: coachId, featured_coach });
      return json({ success: true });
    }

    // ── SITE CONTENT ──
    if (action === "update_site_content") {
      const { section, content } = params;
      const { data: existing } = await supabase.from("site_content").select("id").eq("section", section).single();
      if (existing) {
        const { error } = await supabase.from("site_content").update({ content, updated_at: new Date().toISOString() }).eq("section", section);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_content").insert({ section, content });
        if (error) throw error;
      }
      return json({ success: true });
    }

    // ── PRICING ──
    if (action === "create_pricing") {
      const { pricing } = params;
      const { data, error } = await supabase.from("pricing").insert(pricing).select().single();
      if (error) throw error;
      return json(data);
    }

    if (action === "update_pricing") {
      const { pricingId, pricing } = params;
      const { data, error } = await supabase.from("pricing").update(pricing).eq("id", pricingId).select().single();
      if (error) throw error;
      return json(data);
    }

    if (action === "delete_pricing") {
      const { pricingId } = params;
      const { error } = await supabase.from("pricing").delete().eq("id", pricingId);
      if (error) throw error;
      return json({ success: true });
    }

    // ── PRODUCTS ──
    if (action === "create_product") {
      const { product } = params;
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return json(data);
    }

    if (action === "update_product") {
      const { productId, product } = params;
      const { data, error } = await supabase.from("products").update(product).eq("id", productId).select().single();
      if (error) throw error;
      return json(data);
    }

    if (action === "delete_product") {
      const { productId } = params;
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
      return json({ success: true });
    }

    // ── DRINKS ──
    if (action === "create_drink") {
      const { drink } = params;
      const { data, error } = await supabase.from("admin_drinks").insert(drink).select().single();
      if (error) throw error;
      return json(data);
    }

    if (action === "update_drink") {
      const { drinkId, drink } = params;
      const { data, error } = await supabase.from("admin_drinks").update(drink).eq("id", drinkId).select().single();
      if (error) throw error;
      return json(data);
    }

    if (action === "delete_drink") {
      const { drinkId } = params;
      const { error } = await supabase.from("admin_drinks").delete().eq("id", drinkId);
      if (error) throw error;
      return json({ success: true });
    }

    // ── PACKS ──
    if (action === "create_blackcard_request") {
      const {
        client_name,
        client_email,
        client_phone,
        offer_id,
        offer_name,
        credits_total,
        payment_method = "cash_on_site",
        request_source = "admin",
      } = params;

      const { data, error } = await supabase
        .from("code_creation_requests")
        .insert({
          client_name: client_name || "",
          client_email: client_email || "",
          client_phone: client_phone || null,
          offer_id: offer_id || null,
          offer_name: offer_name || "Carte Black",
          credits_total: credits_total || 10,
          payment_method,
          payment_status: payment_method === "online" ? "paid" : "pending",
          request_source,
          request_status: payment_method === "online" ? "auto_generated" : "pending",
        })
        .select()
        .single();
      if (error) throw error;
      await logJournal("blackcard_request_created", "admin", { request_id: data.id, payment_method });
      await logActivity("admin", "blackcard_request_created", data.id, { payment_method, request_source });
      return json(data);
    }

    if (action === "approve_blackcard_request") {
      const { request_id, actor = "admin", payment_source = "paid_on_site" } = params;
      const { data: reqRow, error: reqErr } = await supabase.from("code_creation_requests").select("*").eq("id", request_id).single();
      if (reqErr) throw reqErr;
      if (reqRow.request_status === "approved") return json({ success: true, alreadyGenerated: true });

      let code = "";
      for (let i = 0; i < 8; i++) {
        const candidate = generateBlackCardCode();
        const { data: found } = await supabase.from("packs").select("id").eq("pack_code", candidate).maybeSingle();
        if (!found) {
          code = candidate;
          break;
        }
      }
      if (!code) throw new Error("Impossible de générer un code unique");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      const { data: pack, error: packErr } = await supabase
        .from("packs")
        .insert({
          pack_code: code,
          pack_type: "carte_black",
          client_name: reqRow.client_name || "",
          client_email: reqRow.client_email || "",
          client_phone: reqRow.client_phone || null,
          credits_total: reqRow.credits_total || 10,
          credits_used: 0,
          is_active: true,
          payment_status: "paid",
          expires_at: expiresAt.toISOString(),
          created_by: actor,
        })
        .select()
        .single();
      if (packErr) throw packErr;

      await supabase
        .from("code_creation_requests")
        .update({
          request_status: "approved",
          payment_status: "paid",
          metadata: { generated_pack_id: pack.id, approved_at: new Date().toISOString() },
        })
        .eq("id", reqRow.id);

      await logJournal("blackcard_request_approved", actor, { request_id, pack_id: pack.id, pack_code: code });
      await logActivity(actor, "blackcard_request_approved", request_id, { pack_id: pack.id, payment_source });
      await logActivity(actor, "blackcard_generated", pack.id, { request_id, pack_code: code });
      return json({ success: true, pack });
    }

    if (action === "reject_blackcard_request") {
      const { request_id, reason, actor = "admin" } = params;
      const { error } = await supabase
        .from("code_creation_requests")
        .update({ request_status: "rejected", updated_at: new Date().toISOString(), metadata: { reason: reason || null } })
        .eq("id", request_id);
      if (error) throw error;
      await logJournal("blackcard_request_rejected", actor, { request_id, reason: reason || null });
      await logActivity(actor, "blackcard_request_rejected", request_id, { reason: reason || null });
      return json({ success: true });
    }

    if (action === "generate_pack") {
      const { client_name, client_email, client_phone, pack_type, credits_total, custom_credits, validity_days, notes, offer_id, offer_name } = params;
      let code = "";
      for (let i = 0; i < 8; i++) {
        const candidate = generateBlackCardCode();
        const { data: found } = await supabase.from("packs").select("id").eq("pack_code", candidate).maybeSingle();
        if (!found) {
          code = candidate;
          break;
        }
      }
      if (!code) throw new Error("Impossible de générer un code unique");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (validity_days || 90));

      const { data, error } = await supabase.from("packs").insert({
        pack_code: code,
        client_name: client_name || "",
        client_email: client_email || "",
        client_phone: client_phone || null,
        pack_type: pack_type || "carte_black",
        credits_total: custom_credits || credits_total || 10,
        credits_used: 0,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        notes: notes || null,
        payment_status: "paid",
        created_by: "admin",
      }).select().single();

      if (error) throw error;
      await logJournal("generate_pack", "admin", { pack_id: data.id, code, pack_type, offer_name: offer_name || null });
      await logActivity("admin", "blackcard_generated", data.id, { code, pack_type, offer_name: offer_name || null });
      return json({ code, pack: data });
    }

    if (action === "get_pack_history") {
      const { pack_code } = params;
      const [logRes, packRes] = await Promise.all([
        supabase.from("pack_usage_log").select("*").eq("pack_code", pack_code).order("used_at", { ascending: false }),
        supabase.from("packs").select("*").eq("pack_code", pack_code).maybeSingle(),
      ]);
      if (logRes.error) throw logRes.error;
      if (packRes.error) throw packRes.error;

      let request = null;
      let usage = [] as any[];
      return json({ usageLog: logRes.data || [], blackcardUsage: usage, pack: packRes.data, request });
    }

    if (action === "adjust_pack_credits") {
      const { pack_id, new_credits_used, reason, confirm_password } = params;
      if (confirm_password !== ADMIN_PASSWORD) throw new Error("Confirmation admin invalide");

      const { data: prev } = await supabase.from("packs").select("credits_used, credits_total").eq("id", pack_id).single();
      const { error } = await supabase.from("packs").update({ credits_used: new_credits_used }).eq("id", pack_id);
      if (error) throw error;
      if (error) throw error;
      await logJournal("adjust_pack_credits", "admin", { pack_id, new_credits_used, reason });
      await logActivity("admin", "blackcard_edited", pack_id, {
        before: { credits_used: prev?.credits_used || 0 },
        after: { credits_used: new_credits_used },
        reason: reason || null,
      });
      return json({ success: true });
    }

    if (action === "deactivate_pack") {
      const { pack_id, reason } = params;
      const { error } = await supabase.from("packs").update({ is_active: false }).eq("id", pack_id);
      if (error) throw error;
      await logJournal("deactivate_pack", "admin", { pack_id, reason });
      return json({ success: true });
    }

    if (action === "delete_pack") {
      const { pack_id, reason, deleted_by } = params;
      const { error } = await supabase.from("packs").delete().eq("id", pack_id);
      if (error) throw error;
      await logJournal("delete_pack", deleted_by || "admin", { pack_id, reason });
      return json({ success: true });
    }

    // ── JOURNAL ──
    if (action === "get_journal") {
      const { limit: lim = 100 } = params;
      const { data, error } = await supabase.from("admin_journal").select("*").order("created_at", { ascending: false }).limit(lim);
      if (error) throw error;
      return json({ journal: data });
    }

    // ── CLIENT NOTES ──
    if (action === "get_client_notes") {
      const { client_email } = params;
      const { data, error } = await supabase.from("client_notes").select("*").eq("client_email", client_email.toLowerCase().trim()).order("created_at", { ascending: false });
      if (error) throw error;
      return json(data);
    }

    if (action === "add_client_note") {
      const { client_email, note } = params;
      if (!client_email || !note?.trim()) throw new Error("Email et note requis");
      const { data, error } = await supabase.from("client_notes").insert({
        client_email: client_email.toLowerCase().trim(),
        note: note.trim(),
        created_by: "admin",
      }).select().single();
      if (error) throw error;
      await logJournal("add_client_note", "admin", { client_email, note: note.trim().slice(0, 100) });
      await logActivity("admin", "crm_note_created", client_email.toLowerCase().trim(), { note: note.trim().slice(0, 120) });
      return json(data);
    }

    if (action === "add_client_tag") {
      const { client_email, tag } = params;
      if (!client_email || !tag?.trim()) throw new Error("Email et tag requis");
      const email = client_email.toLowerCase().trim();
      const cleanTag = tag.trim().toLowerCase();
      const { data, error } = await supabase
        .from("client_tags")
        .upsert({ client_email: email, tag: cleanTag, created_by: "admin" }, { onConflict: "client_email,tag" })
        .select()
        .single();
      if (error) throw error;
      await logActivity("admin", "crm_tag_added", email, { tag: cleanTag });
      return json(data);
    }

    if (action === "mark_follow_up") {
      const { client_email, reason, due_at } = params;
      if (!client_email) throw new Error("Email requis");
      const email = client_email.toLowerCase().trim();
      const { data, error } = await supabase
        .from("client_followups")
        .insert({ client_email: email, reason: reason || null, due_at: due_at || null, status: "open", created_by: "admin" })
        .select()
        .single();
      if (error) throw error;
      await logActivity("admin", "crm_followup_marked", email, { reason: reason || null, due_at: due_at || null });
      return json(data);
    }

    if (action === "create_retention_offer") {
      const { client_email, segment = null, offer_type = "comeback", discount_percent = 20, expires_days = 14 } = params;
      const email = client_email ? client_email.toLowerCase().trim() : null;
      const code = `CB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expires_days || 14));
      const { data, error } = await supabase
        .from("retention_offers")
        .insert({
          client_email: email,
          segment,
          offer_type,
          offer_code: code,
          discount_percent,
          expires_at: expiresAt.toISOString(),
          status: "unused",
          created_by: "admin",
        })
        .select()
        .single();
      if (error) throw error;
      await logActivity("admin", "retention_offer_generated", email, { offer_type, code, discount_percent, segment });
      return json(data);
    }

    if (action === "log_whatsapp_action") {
      const { client_email, template = "generic" } = params;
      if (!client_email) throw new Error("Email requis");
      await logActivity("admin", "whatsapp_action_opened", client_email.toLowerCase().trim(), { template });
      return json({ success: true });
    }

    if (action === "delete_client_note") {
      const { note_id } = params;
      const { error } = await supabase.from("client_notes").delete().eq("id", note_id);
      if (error) throw error;
      return json({ success: true });
    }

    // ── CLIENT ACTIVITY (merged timeline) ──
    if (action === "get_client_activity") {
      const { client_email } = params;
      const email = client_email.toLowerCase().trim();

      const [bookingsRes, participantsRes, packsRes, packUsageRes, notesRes, ordersRes, tagsRes, offersRes, followupsRes, actRes] = await Promise.all([
        supabase.from("bookings").select("*").eq("client_email", email).order("created_at", { ascending: false }),
        supabase.from("session_participants").select("*, sessions(title, date, time, price, instructor)").eq("email", email).order("registered_at", { ascending: false }),
        supabase.from("packs").select("*").eq("client_email", email).order("created_at", { ascending: false }),
        supabase.from("pack_usage_log").select("*").eq("used_by_name", email).order("used_at", { ascending: false }),
        supabase.from("client_notes").select("*").eq("client_email", email).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("client_email", email).order("created_at", { ascending: false }),
        supabase.from("client_tags").select("*").eq("client_email", email).order("created_at", { ascending: false }),
        supabase.from("retention_offers").select("*").eq("client_email", email).order("created_at", { ascending: false }),
        supabase.from("client_followups").select("*").eq("client_email", email).order("created_at", { ascending: false }),
        supabase.from("activity_log").select("*").eq("target_id", email).order("created_at", { ascending: false }).limit(100),
      ]);

      return json({
        bookings: bookingsRes.data || [],
        participants: participantsRes.data || [],
        packs: packsRes.data || [],
        packUsage: packUsageRes.data || [],
        notes: notesRes.data || [],
        orders: ordersRes.data || [],
        tags: tagsRes.data || [],
        offers: offersRes.data || [],
        followups: followupsRes.data || [],
        activityLog: actRes.data || [],
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type or action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
