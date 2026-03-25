/**
 * EVØLV — Frontend API client
 * Replaces all supabase.from() calls with typed fetch wrappers.
 */

const TOKEN_KEY = "evolv_admin_token";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `API error ${res.status}`);
  return data as T;
}

// ── Sessions ──────────────────────────────────────────────────────
export const api = {
  sessions: {
    list: (params?: { fromToday?: boolean; activeOnly?: boolean; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.fromToday) q.set("fromToday", "1");
      if (params?.activeOnly) q.set("activeOnly", "1");
      if (params?.limit) q.set("limit", String(params.limit));
      return apiFetch<any[]>(`/api/sessions?${q}`);
    },
    get: (id: string) => apiFetch<any>(`/api/sessions/${id}`),
    create: (body: any) => apiFetch<any>("/api/sessions", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch<any>(`/api/sessions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => apiFetch<any>(`/api/sessions/${id}`, { method: "DELETE" }),
    registerParticipant: (sessionId: string, body: any) =>
      apiFetch<any>(`/api/sessions/${sessionId}/participants`, { method: "POST", body: JSON.stringify(body) }),
  },

  pricing: {
    list: () => apiFetch<any[]>("/api/pricing"),
    create: (body: any) => apiFetch<any>("/api/pricing", { method: "POST", body: JSON.stringify(body) }),
  },

  coaches: {
    list: () => apiFetch<any[]>("/api/coaches"),
    create: (body: any) => apiFetch<any>("/api/coaches", { method: "POST", body: JSON.stringify(body) }),
  },

  siteContent: {
    get: (section: string) => apiFetch<any>(`/api/site-content?section=${encodeURIComponent(section)}`),
    getAll: () => apiFetch<any[]>("/api/site-content"),
    upsert: (section: string, content: any) =>
      apiFetch<any>("/api/site-content", { method: "PUT", body: JSON.stringify({ section, content }) }),
  },

  packs: {
    lookup: (code: string) => apiFetch<any>(`/api/packs/lookup?code=${encodeURIComponent(code)}`),
    useCredit: (body: any) => apiFetch<any>("/api/packs/use-credit", { method: "POST", body: JSON.stringify(body) }),
  },

  payment: {
    createSession: (body: any) => apiFetch<any>("/api/payment/create-session", { method: "POST", body: JSON.stringify(body) }),
    verify: (body: { request_id?: string; order_id?: string }) =>
      apiFetch<any>("/api/payment/verify", { method: "POST", body: JSON.stringify(body) }),
  },

  contact: {
    submit: (body: any) => apiFetch<any>("/api/contact", { method: "POST", body: JSON.stringify(body) }),
  },

  waitlist: {
    join: (body: any) => apiFetch<any>("/api/waitlist", { method: "POST", body: JSON.stringify(body) }),
    list: () => apiFetch<any[]>("/api/waitlist"),
  },

  boutique: {
    list: (category?: string) => {
      const q = category ? `?category=${encodeURIComponent(category)}` : "";
      return apiFetch<any[]>(`/api/boutique${q}`);
    },
    create: (body: any) => apiFetch<any>("/api/boutique", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch<any>(`/api/boutique?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => apiFetch<any>(`/api/boutique?id=${id}`, { method: "DELETE" }),
  },

  drinks: {
    list: () => apiFetch<any[]>("/api/drinks"),
    create: (body: any) => apiFetch<any>("/api/drinks", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch<any>(`/api/drinks?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },

  admin: {
    dashboard: () => apiFetch<any>("/api/admin/dashboard"),
    packs: {
      list: (params?: { search?: string; status?: string; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set("search", params.search);
        if (params?.status) q.set("status", params.status);
        if (params?.limit) q.set("limit", String(params.limit));
        return apiFetch<any[]>(`/api/admin/packs?${q}`);
      },
      create: (body: any) => apiFetch<any>("/api/admin/packs", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: any) => apiFetch<any>(`/api/admin/packs?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) => apiFetch<any>(`/api/admin/packs?id=${id}`, { method: "DELETE" }),
    },
    planning: {
      list: (params?: { from?: string; to?: string }) => {
        const q = new URLSearchParams(params as any);
        return apiFetch<any[]>(`/api/admin/planning?${q}`);
      },
      participants: (sessionId: string) => apiFetch<any[]>(`/api/admin/planning?session_id=${sessionId}`),
      create: (body: any) => apiFetch<any>("/api/admin/planning", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: any) => apiFetch<any>(`/api/admin/planning?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) => apiFetch<any>(`/api/admin/planning?id=${id}`, { method: "DELETE" }),
    },
    pricing: {
      list: () => apiFetch<any[]>("/api/admin/pricing"),
      create: (body: any) => apiFetch<any>("/api/admin/pricing", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: any) => apiFetch<any>(`/api/admin/pricing?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) => apiFetch<any>(`/api/admin/pricing?id=${id}`, { method: "DELETE" }),
    },
    contacts: {
      list: () => apiFetch<any[]>("/api/admin/contacts"),
      update: (id: string, body: any) => apiFetch<any>(`/api/admin/contacts?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) => apiFetch<any>(`/api/admin/contacts?id=${id}`, { method: "DELETE" }),
    },
    crm: {
      clients: () => apiFetch<any[]>("/api/admin/crm"),
      tags: () => apiFetch<any[]>("/api/admin/crm?resource=tags"),
      retention: () => apiFetch<any[]>("/api/admin/crm?resource=retention"),
      followups: () => apiFetch<any[]>("/api/admin/crm?resource=followups"),
      reminders: () => apiFetch<any[]>("/api/admin/crm?resource=reminders"),
      createFollowup: (body: any) => apiFetch<any>("/api/admin/crm?resource=followups", { method: "POST", body: JSON.stringify(body) }),
      updateFollowup: (id: string, body: any) => apiFetch<any>(`/api/admin/crm?resource=followups&id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      createReminder: (body: any) => apiFetch<any>("/api/admin/crm?resource=reminders", { method: "POST", body: JSON.stringify(body) }),
    },
    coaches: {
      list: () => apiFetch<any[]>("/api/coaches"),
      create: (body: any) => apiFetch<any>("/api/coaches", { method: "POST", body: JSON.stringify(body) }),
    },
    boutique: {
      list: () => apiFetch<any[]>("/api/boutique"),
      create: (body: any) => apiFetch<any>("/api/boutique", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: any) => apiFetch<any>(`/api/boutique?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) => apiFetch<any>(`/api/boutique?id=${id}`, { method: "DELETE" }),
    },
    drinks: {
      list: () => apiFetch<any[]>("/api/drinks"),
      create: (body: any) => apiFetch<any>("/api/drinks", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: any) => apiFetch<any>(`/api/drinks?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    },
    siteContent: {
      getAll: () => apiFetch<any[]>("/api/site-content"),
      upsert: (section: string, content: any) =>
        apiFetch<any>("/api/site-content", { method: "PUT", body: JSON.stringify({ section, content }) }),
    },
    waitlist: {
      list: () => apiFetch<any[]>("/api/waitlist"),
    },
  },
};
