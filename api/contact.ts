import { db, contactSubmissions, activityLog } from "../src/db/index.js";
import { withCors, corsError, optionsResponse } from "./_lib/cors.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return corsError("Method not allowed", 405);

  try {
    const { name, email, phone, message, subject } = await req.json();
    if (!name || !email || !message) return corsError("name, email, message required", 400);

    const [submission] = await db.insert(contactSubmissions).values({
      name, email, phone: phone || null, message, subject: subject || null,
    }).returning();

    await db.insert(activityLog).values({
      actor: "frontend",
      action: "contact_submitted",
      target_id: submission.id,
      metadata: { email, subject: subject || null },
    });

    return withCors({ success: true, id: submission.id });
  } catch (err: any) {
    return corsError(err.message);
  }
}
